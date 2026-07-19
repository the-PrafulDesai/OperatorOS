# Five-minute founder demo

Use placeholders from your private environment: Customer `<demo-customer-email>`, Operator Admin `<operator-id-or-email>`, and Super Admin `<super-admin-email>`. Never put real passwords in this document.

1. Open the public homepage, search Gurugram, and filter Meeting Rooms.
2. Open **WorkNest Cyber City, Gurugram** and show Day Pass, two Meeting Rooms, six Dedicated Desks, and two Private Cabins.
3. Choose **Meeting Room Beta**, enter date/time and attendees, then check availability.
4. Sign in or create the Customer account. Review the ten-minute hold and server-calculated price.
5. Click **Simulate successful payment** and show the readable confirmation reference and My Bookings detail.
6. Sign in as Operator Admin, open Bookings, find the new reservation, check in the customer, then mark it completed. Show status history and the notification.
7. Return to the Customer booking and refresh to show completed status.
8. Sign in as Super Admin. Open Bookings to show customer amount, platform fee, operator earnings, payment, and booking status. Open the dashboard for updated financial metrics.
9. Optional: create another booking and cancel it from Customer or Operator. Show the immediate simulated refund, released availability, notifications, and Super Admin refund value.

Create the demo customer with `npm run bootstrap:demo-customer`. Create demo bookings through the UI so the same atomic invariants used in production demos are exercised.
