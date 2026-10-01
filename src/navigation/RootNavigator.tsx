import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { useTheme } from '@/context/ThemeContext';

import AppShell from './AppShell';
import ProductDetailScreen from '@/screens/ProductDetailScreen';
import CategoryProductsScreen from '@/screens/CategoryProductsScreen';
import MeeshoRedirectScreen from '@/screens/MeeshoRedirectScreen';
import AdminLoginScreen from '@/screens/admin/AdminLoginScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminProductFormScreen from '@/screens/admin/AdminProductFormScreen';
import AdminReviewsScreen from '@/screens/admin/AdminReviewsScreen';
import AdminNotifyScreen from '@/screens/admin/AdminNotifyScreen';
import AdminTestimonialsScreen from '@/screens/admin/AdminTestimonialsScreen';
import AdminHomeScreen from '@/screens/admin/AdminHomeScreen';
import AdminCategoriesScreen from '@/screens/admin/AdminCategoriesScreen';
import AdminAllReviewsScreen from '@/screens/admin/AdminAllReviewsScreen';
import AdminSettingsScreen from '@/screens/admin/AdminSettingsScreen';
import AdminComingSoonScreen from '@/screens/admin/AdminComingSoonScreen';
import TestimonialsScreen from '@/screens/TestimonialsScreen';
import AboutScreen from '@/screens/info/AboutScreen';
import ContactScreen from '@/screens/info/ContactScreen';
import FAQScreen from '@/screens/info/FAQScreen';
import PrivacyPolicyScreen from '@/screens/info/PrivacyPolicyScreen';
import TermsScreen from '@/screens/info/TermsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={AppShell} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
      <Stack.Screen
        name="MeeshoRedirect"
        component={MeeshoRedirectScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen
        name="AdminProductForm"
        component={AdminProductFormScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AdminReviews"
        component={AdminReviewsScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AdminNotify"
        component={AdminNotifyScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AdminTestimonials"
        component={AdminTestimonialsScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
      <Stack.Screen name="AdminAllReviews" component={AdminAllReviewsScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      <Stack.Screen name="AdminComingSoon" component={AdminComingSoonScreen} />
      <Stack.Screen name="Testimonials" component={TestimonialsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
}
