export interface Profile {
  id: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
}

export interface Merchant {
  id: string;
  name: string | null;
  businessName: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  category: string | null;
  logo: string | null;
  description: string | null;
  createdAt: string | null;
  rating: number | null;
  review_count: number | null;
  opening_hours: string | null;
  payout_details: {
    accountNumber?: string;
    bankName?: string;
    momoNetwork?: string;
    momoNumber?: string;
  } | null;
  social_links: {
    closedDays?: string;
    vatNumber?: string;
    website?: string;
  } | null;
  notifications: {
    marketing?: boolean;
    newRedemption?: boolean;
    payoutUpdate?: boolean;
    weeklyReport?: boolean;
  } | null;
}

export interface SubDeal {
  title: string;
  original_price: string;
  discounted_price: string;
  discount_percentage: number;
}

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  originalPrice: string;
  original_price: string;
  price: string;
  discounted_price: string;
  discountPct: number;
  discount_percentage: number;
  vouchers_available: string | null;
  sold_count: number | null;
  status: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  expiry_date: string | null;
  validUntil: string | null;
  createdAt: string;
  merchantId: string;
  location: string | null;
  redemption_rules: string | null;
  subDeals: SubDeal[] | null;
}

export interface Coupon {
  id: string;
  code: string;
  deal_id: string | null;
  option_id: string | null;
  user_id: string | null;
  status: string | null;
  purchase_date: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  status: string;
  type: string;
  user_id: string;
  date: string;
  description: string | null;
  created_at: string | null;
}
