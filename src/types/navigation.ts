import type { CategoryKey } from './product';

export type RootStackParamList = {
  Tabs: undefined;
  ProductDetail: { productId: string };
  CategoryProducts: { category: CategoryKey; label: string };
  MeeshoRedirect: { url: string; productTitle: string };
  AdminLogin: undefined;
  AdminDashboard: undefined;
  AdminProductForm: { productId?: string };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Wishlist: undefined;
  Profile: undefined;
};
