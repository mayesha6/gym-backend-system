Gymdesk Integration & Subscription Guide

১. Gymdesk সম্পর্কে সহজ ভাষায় (What is Gymdesk?)

Gymdesk হলো জিম (Gym), ফিটনেস সেন্টার এবং মার্শাল আর্টস ক্লাবের জন্য তৈরি একটি All-in-One Gym Management Software।

Gymdesk এর মূল কাজগুলো:
1. Subscription & Automatic Billing: জিমের মেম্বারদের প্রতি মাসে অটোমেটিক সাবস্ক্রিপশন বিলিং ও পেমেন্ট প্রসেস করা।
2. Member Management: মেম্বারদের প্রোফাইল, অ্যাটেনডেন্স এবং মেম্বারশিপ স্ট্যাটাস ট্র্যাক করা।
3. Class & Booking: ক্লাস সিডিউল এবং মেম্বার বুকিং হ্যান্ডেল করা।
4. Security & Payment Compliance: PCI-DSS সিকিউরিটি স্ট্যান্ডার্ড মেনে কার্ড পেমেন্ট নিরাপদভাবে প্রসেস করা (যেমন: Stripe, Ezypay বা Authorize.net এর মাধ্যমে)।

--------------------------------------------------

২. Gymdesk API দিয়ে কি আপনার চাওয়া কাজটা করা যাবে?

সংক্ষেপে উত্তর: আংশিক করা যাবে, তবে সরাসরি raw কার্ডের তথ্য আমাদের সিস্টেম দিয়ে পাঠানো যাবে না (Security Constraint)।

কেন এবং কীভাবে কাজ করবে?

1. Card Security (PCI Compliance Constraint):
   - Gymdesk (বা যেকোনো স্ট্যান্ডার্ড পেমেন্ট সিস্টেম যেমন Stripe) নিরাপত্তাজনিত কারণে (PCI-DSS Rules) কোনো External API দিয়ে সরাসরি কাঁচা Card Number, CVV, Expiry Date গ্রহণ করে না।
   - অর্থাৎ, আমাদের সিস্টেমে কার্ডের নম্বর টাইপ করে API দিয়ে Gymdesk-এ পাঠিয়ে দেওয়া যাবে না।

2. সমাধান এবং সঠিক Workflow কী?

   * Option A: Gymdesk Hosted Sign-up / Embedded Form (সবচেয়ে সহজ ও স্ট্যান্ডার্ড উপায়)
     - আমাদের সিস্টেমে User Personal Information নিবেন।
     - পেমেন্ট ও সাবস্ক্রিপশন পার্টের জন্য Gymdesk-এর Secure iFrame Widget বা Gymdesk Sign-up Page এমবেড করা থাকবে।
     - ইউজার সরাসরি সেই সিকিউর ফর্মে কার্ডের তথ্য দিবে। পেমেন্ট সম্পন্ন হলে Gymdesk Webhook বা API এর মাধ্যমে আমাদের সিস্টেমে Status Update করে দেবে।

   * Option B: Payment Tokenization (Stripe / Gymdesk Processor Token)
     - যদি Gymdesk-এর সাথে Stripe সংযুক্ত থাকে, তবে আমাদের ফ্রন্টএন্ডে Stripe Elements ইউজ করে কার্ডের তথ্য থেকে একটি Secure Token তৈরি করা হয়।
     - সেই Token এবং User Info Gymdesk/Stripe API-তে পাঠালে পেমেন্ট/সাবস্ক্রিপশন চালু হয় (কার্ডের গোপন নম্বর আমাদের সার্ভারে কখনই সেভ হয় না)।

--------------------------------------------------

৩. রিকোয়ারমেন্ট সামারি (Requirement Summary):

1. User & Card Information Collection:
   - আমাদের সিস্টেম User-এর যাবতীয় তথ্য (Personal Details) এবং Card-এর তথ্য (Card Details / Payment Details) ইনপুট নিবে।

2. Gymdesk Integration for Subscription & Payment:
   - User-এর তথ্য এবং Card Details সংগ্রহ করে Gymdesk-এর সাথে ইন্টিগ্রেট করে পাঠানো হবে।
   - Subscription তৈরি এবং Payment Processing / Card Charge করার পুরো কাজটাই সম্পন্ন করবে Gymdesk।

3. No Direct Financial Transactions in Our System:
   - আমাদের Backend/System-এ সরাসরি কোনো টাকা-পয়সার লেনদেন (Payment Gateway Charge, Transaction processing, Payment record for money) হবে না।
   - আমাদের সিস্টেম মূলত তথ্য সংগ্রহ করে Gymdesk-এ পাঠাবে এবং Gymdesk-এর সাথে Sync রাখবে।
