# **App Name**: Bracket Battles

## Core Features:

- Tournament Overview: Display a list of active and upcoming tournaments with key details and status, retrieved from Firebase.
- Real-time Match Viewer: Provide a detailed view for each match, showing live scores, current status, and relevant player/team information, updating in real-time from Firebase.
- User Voting System: Allow authenticated users to cast votes on match outcomes, favorite players, or other predefined tournament elements, with votes securely stored and managed in Firebase.
- Admin Score Update Interface: A simplified, secure interface for administrators to manually input and update match scores in Firebase, ensuring real-time data accuracy across the dashboard.
- User Authentication & Advanced Security: Secure user registration and login functionality using Firebase Authentication. This feature includes phone OTP verification for enhanced security and device ID (IMEI/Android ID) restriction to prevent multiple accounts per device, managing voting access and personalized content.
- AI Match Insight Tool: Utilizes generative AI to analyze match data (e.g., scores, votes, player stats) and provide quick, engaging summaries or potential game-changing moments as a descriptive tool.
- Referral Rewards System: Implement a system where users can refer new players, earning rewards linked to the referred user's first paid tournament entry, with referral tracking and reward distribution managed in Firebase.
- Admin User Search and Filter: Enable administrators to efficiently search and filter registered users by mobile number or device ID for user management and security purposes, leveraging user data stored in Firebase.
- Detailed Financial Ledger: A feature for each user including Total Deposit, Withdrawal, and Downline Income history, stored and retrieved from Firebase.
- CPA Lead Offer Wall: Integrate a WebView component to display a CPA Lead Offer Wall, allowing users to complete offers and earn virtual currency.
- Virtual Currency System: Implement a virtual currency system where users earn 'coins' by completing tasks from the Offer Wall. These coins can then be used to pay for tournament entry fees.
- Telegram Support Button: A button allowing users to quickly access customer support via Telegram.
- Maintenance Mode Toggle: An administrator-only toggle to enable or disable maintenance mode, preventing regular user access during updates or issues.
- Push Notifications: Implement push notifications for important updates, match results, tournament reminders, and promotional offers.
- Terms and Privacy Page: Dedicated pages outlining the application's terms of service and privacy policy.

## Style Guidelines:

- Dark color scheme to evoke a modern, focused, and immersive experience, fitting for competitive dashboards.
- Primary accent color: Vibrant Purple (#9345FF), reflecting energy and competition.
- Background color: Deep Slate Grey (#25202A), a heavily desaturated variant of the primary hue, providing a subtle depth.
- Secondary accent color: Bright Sky Blue (#AEDDFF), analogous to the primary but lighter, used for highlights, interactive elements, and key information, creating visual contrast and guiding user attention.
- All text will use 'Inter' (sans-serif), chosen for its modern, neutral, and highly readable qualities, ideal for data-dense dashboards.
- Clean, outlined icons will be used for navigation and actions, maintaining a streamlined and contemporary look.
- A card-based layout will be utilized to segment information clearly, facilitating quick digestion of real-time scores and tournament details.
- Subtle transitions and micro-animations will be implemented for real-time updates and interactive elements to provide visual feedback without distraction.