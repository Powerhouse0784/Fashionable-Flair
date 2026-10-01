import type { CategoryKey } from './product';

export type RootStackParamList = {
  Tabs: undefined;
  ProductDetail: { productId: string };
  CategoryProducts: { category: CategoryKey; label: string };
  MeeshoRedirect: { url: string; productTitle: string };
  AdminLogin: undefined;
  AdminDashboard: undefined;
  AdminProductForm: { productId?: string };
  AdminReviews: { productId: string; productTitle: string };
  AdminNotify: undefined;
  AdminTestimonials: undefined;
  AdminHome: undefined;
  AdminCategories: undefined;
  AdminAllReviews: undefined;
  AdminSettings: undefined;
  AdminComingSoon: { title: string; icon: string; description: string };
  Testimonials: undefined;
  About: undefined;
  Contact: undefined;
  FAQ: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Wishlist: undefined;
  Profile: undefined;
};
