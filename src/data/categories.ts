import { Category } from '@/types/product';

export const categories: Category[] = [
  {
    key: 'earrings',
    label: 'Earrings & Studs',
    icon: 'diamond-outline',
    image: require('@/assets/categories/earrings-studs.jpg'),
  },
  {
    key: 'pendants',
    label: 'Pendants & Chains',
    icon: 'heart-outline',
    image: require('@/assets/categories/pendants-chains.jpg'),
  },
  {
    key: 'jewellery-sets',
    label: 'Jewellery Sets',
    icon: 'sparkles-outline',
    image: require('@/assets/categories/jewellery-sets.jpg'),
  },
  {
    key: 'bracelets',
    label: 'Bracelets & Bangles',
    icon: 'infinite-outline',
    image: require('@/assets/categories/bracelets-bangles.jpg'),
  },
  {
    key: 'hair-accessories',
    label: 'Hair Accessories',
    icon: 'flower-outline',
    image: require('@/assets/categories/hair-accessories.jpg'),
  },
];
