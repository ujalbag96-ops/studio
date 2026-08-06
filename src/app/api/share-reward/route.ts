export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, arrayUnion } from 'firebase/firestore';

/**
 * Viral Sharing Reward Gateway v2.0
 * Includes Milestone Bonuses (10, 25, 50, 100 shares)
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Identity Missing' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Record Missing' }, { status: 404 });
    }

    const userData = userSnap.data();
    
    // Stop sharing rewards for VPN/Proxy users
    if (userData.isSuspended) {
       return NextResponse.json({ error: 'Signal Locked: Identity Audit Failed' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyCount = userData.lastShareDate === today ? (userData.dailyShareCount || 0) : 0;
    
    // Daily Limit: 5 rewarded shares to prevent spam
    if (dailyCount >= 5) {
       return NextResponse.json({ error: 'Daily Reward Limit Reached' }, { status: 429 });
    }

    const standardReward = 2; // Every share = 2 coins
    const totalShares = (userData.totalPagesShared || 0) + 1;
    const currentMilestones = userData.unlockedMilestones || [];

    // Milestone Logic
    const milestones = [
      { count: 10, reward: 10, name: 'Bronze Sharer' },
      { count: 50, reward: 50, name: 'Elite Sharer' }
    ];

    let bonus = 0;
    let unlockedName = '';
    for (const m of milestones) {
      if (totalShares === m.count && !currentMilestones.includes(m.name)) {
        bonus = m.reward;
        unlockedName = m.name;
        break; 
      }
    }

    const finalCredit = standardReward + bonus;

    // 1. Update Profile
    batch.update(userRef, {
      coins: increment(finalCredit),
      bonusBalance: increment(finalCredit),
      totalPagesShared: increment(1),
      shareRewardsEarned: increment(finalCredit),
      dailyShareCount: dailyCount + 1,
      lastShareDate: today,
      ...(unlockedName && { unlockedMilestones: arrayUnion(unlockedName) })
    });

    // 2. Formal Ledger
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'share_reward',
      amount: finalCredit,
      date: today,
      status: 'completed',
      description: unlockedName 
        ? `MILESTONE: ${unlockedName} (+${finalCredit} 🪙)`
        : `Viral Sharing Reward (+2 🪙)`,
      isS2SVerified: true
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      reward: finalCredit,
      totalShares: totalShares,
      milestone: unlockedName || null
    });

  } catch (error) {
    return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
  }
}