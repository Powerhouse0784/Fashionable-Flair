import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { colors } from '@/theme';

import AppShell from './AppShell';
import ProductDetailScreen from '@/screens/ProductDetailScreen';
import CategoryProductsScreen from '@/screens/CategoryProductsScreen';
import MeeshoRedirectScreen from '@/screens/MeeshoRedirectScreen';
import AdminLoginScreen from '@/screens/admin/AdminLoginScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminProductFormScreen from '@/screens/admin/AdminProductFormScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
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
    </Stack.Navigator>
  );
}
