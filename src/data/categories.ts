import { Category } from '@/types/product';

export const categories: Category[] = [
  {
    key: 'earrings',
    label: 'Earrings & Studs',
    icon: 'diamond-outline',
    image: require('@/assets/categories/earrings-studs.png'),
  },
  {
    key: 'pendants',
    label: 'Pendants & Chains',
    icon: 'heart-outline',
    image: require('@/assets/categories/pendants-chains.png'),
  },
  {
    key: 'jewellery-sets',
    label: 'Jewellery Sets',
    icon: 'sparkles-outline',
    image: require('@/assets/categories/jewellery-sets.png'),
  },
  {
    key: 'bracelets',
    label: 'Bracelets & Bangles',
    icon: 'infinite-outline',
    image: require('@/assets/categories/bracelets-bangles.png'),
  },
  {
    key: 'hair-accessories',
    label: 'Hair Accessories',
    icon: 'flower-outline',
    image: require('@/assets/categories/hair-accessories.png'),
  },
];
