
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, increment, collection, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { userId, reward } = await request.json();

    if (!userId || isNaN(reward)) {
      return NextResponse.json({ error: 'Invalid Signal' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);
    
    const userRef = doc(firestore, 'users', userId);
    const settingsRef = doc(firestore, 'app_settings', 'global_config');
    const statsRef = doc(firestore, 'platform_stats', 'revenue');

    const [userSnap, settingsSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(settingsRef)
    ]);

    if (!userSnap.exists() || !settingsSnap.exists()) {
      return NextResponse.json({ error: 'Infrastructure Records Missing' }, { status: 404 });
    }

    const userData = userSnap.data();
    const settingsData = settingsSnap.data();
    const sharePercent = settingsData.userRevenueSharePercent || 30;

    // Platform Revenue Estimation: 100 coins reward = approx $0.10 platform earning
    const estimatedPlatformEarningUSD = (reward / 1000); 
    const userShareUSD = estimatedPlatformEarningUSD * (sharePercent / 100);

    // 1. Update User Balances
    batch.update(userRef, {
      bonusBalance: increment(reward),
      coins: increment(reward),
      generalTasksCount: increment(1),
      pendingRevenueShare: increment(userShareUSD)
    });

    // 2. Update Global Platform Stats
    batch.set(statsRef, {
      totalDailyRevenueUSD: increment(estimatedPlatformEarningUSD),
      totalDistributedToUsersUSD: increment(userShareUSD),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 3. Ledger Log
    batch.set(doc(collection(firestore, 'users', userId, 'ledger')), {
      type: 'video_reward',
      amount: reward,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Transparency Signal: Ad Reward Synced (${sharePercent}% Share)`,
      profitShareUSD: userShareUSD
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      credit: reward,
      shareUSD: userShareUSD
    });

  } catch (error) {
    return NextResponse.json({ error: 'Operational Node Offline' }, { status: 500 });
  }
}
