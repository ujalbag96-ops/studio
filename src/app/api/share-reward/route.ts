
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, arrayUnion, addDoc } from 'firebase/firestore';

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
    const today = new Date().toISOString().split('T')[0];
    
    // Check Daily Limit (5 rewards per day)
    const dailyCount = userData.lastShareDate === today ? (userData.dailyShareCount || 0) : 0;
    
    if (dailyCount >= 5) {
       return NextResponse.json({ error: 'Daily Share Reward Limit Reached' }, { status: 429 });
    }

    const standardReward = 2;
    const totalShares = (userData.totalPagesShared || 0) + 1;
    const currentMilestones = userData.unlockedMilestones || [];

    // Milestone Check Logic
    const milestones = [
      { count: 10, reward: 10, name: 'Bronze Sharer' },
      { count: 25, reward: 25, name: 'Silver Sharer' },
      { count: 50, reward: 50, name: 'Gold Sharer' },
      { count: 100, reward: 100, name: 'Elite Sharer' }
    ];

    let milestoneBonus = 0;
    let unlockedName = '';

    for (const m of milestones) {
      if (totalShares >= m.count && !currentMilestones.includes(m.name)) {
        milestoneBonus = m.reward;
        unlockedName = m.name;
        break; 
      }
    }

    const finalCredit = standardReward + milestoneBonus;

    // 1. Update Profile Stats
    batch.update(userRef, {
      coins: increment(finalCredit),
      bonusBalance: increment(finalCredit),
      totalPagesShared: increment(1),
      shareRewardsEarned: increment(finalCredit),
      dailyShareCount: dailyCount + 1,
      lastShareDate: today,
      ...(unlockedName && { unlockedMilestones: arrayUnion(unlockedName) })
    });

    // 2. Ledger Receipt
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'share_reward',
      amount: finalCredit,
      date: today,
      status: 'completed',
      description: unlockedName 
        ? `MILESTONE UNLOCKED: ${unlockedName} (+${finalCredit} 🪙)`
        : `Viral Sharing Reward (+2 🪙)`,
      isPostbackVerified: true
    });

    // 3. Notification if Milestone hit
    if (unlockedName) {
      const notifRef = doc(collection(firestore, 'notifications'));
      batch.set(notifRef, {
        userId,
        title: `🏆 NEW MILESTONE: ${unlockedName}`,
        body: `Congratulations! You've reached ${totalShares} total shares. We've added a special ${milestoneBonus} coin bonus to your vault.`,
        timestamp: new Date().toISOString(),
        type: 'mission'
      });
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      reward: finalCredit, 
      milestone: unlockedName || null,
      currentDaily: dailyCount + 1 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
  }
}
