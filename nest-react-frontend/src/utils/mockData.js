/**
 * Mock data for categories, subcategories, and subcategory1s
 * This can be used as fallback when API is unavailable or for development
 */

export const mockCategories = [
  {
    id: '1',
    categoryName: 'Men',
    categorySlug: 'men',
    isActive: true,
    subCategories: [
      {
        id: '1-1',
        subCategoryName: 'Men\'s Clothing',
        categoryCode: 'MEN-CLOTHING',
        isActive: true,
        subCategory1s: [
          {
            id: '1-1-1',
            subCategoryName: 'T-Shirts',
            categoryCode: 'MEN-CLOTHING-TSHIRTS',
            isActive: true
          },
          {
            id: '1-1-2',
            subCategoryName: 'Shirts',
            categoryCode: 'MEN-CLOTHING-SHIRTS',
            isActive: true
          },
          {
            id: '1-1-3',
            subCategoryName: 'Pants',
            categoryCode: 'MEN-CLOTHING-PANTS',
            isActive: true
          },
          {
            id: '1-1-4',
            subCategoryName: 'Jeans',
            categoryCode: 'MEN-CLOTHING-JEANS',
            isActive: true
          }
        ]
      },
      {
        id: '1-2',
        subCategoryName: 'Men\'s Shoes',
        categoryCode: 'MEN-SHOES',
        isActive: true,
        subCategory1s: [
          {
            id: '1-2-1',
            subCategoryName: 'Sneakers',
            categoryCode: 'MEN-SHOES-SNEAKERS',
            isActive: true
          },
          {
            id: '1-2-2',
            subCategoryName: 'Dress Shoes',
            categoryCode: 'MEN-SHOES-DRESS',
            isActive: true
          },
          {
            id: '1-2-3',
            subCategoryName: 'Boots',
            categoryCode: 'MEN-SHOES-BOOTS',
            isActive: true
          }
        ]
      },
      {
        id: '1-3',
        subCategoryName: 'Men\'s Accessories',
        categoryCode: 'MEN-ACCESSORIES',
        isActive: true,
        subCategory1s: [
          {
            id: '1-3-1',
            subCategoryName: 'Watches',
            categoryCode: 'MEN-ACCESSORIES-WATCHES',
            isActive: true
          },
          {
            id: '1-3-2',
            subCategoryName: 'Belts',
            categoryCode: 'MEN-ACCESSORIES-BELTS',
            isActive: true
          },
          {
            id: '1-3-3',
            subCategoryName: 'Wallets',
            categoryCode: 'MEN-ACCESSORIES-WALLETS',
            isActive: true
          }
        ]
      }
    ],
    subCategory1s: [
      {
        id: '1-4',
        subCategoryName: 'Men\'s Underwear',
        categoryCode: 'MEN-UNDERWEAR',
        isActive: true
      },
      {
        id: '1-5',
        subCategoryName: 'Men\'s Socks',
        categoryCode: 'MEN-SOCKS',
        isActive: true
      }
    ]
  },
  {
    id: '2',
    categoryName: 'Women',
    categorySlug: 'women',
    isActive: true,
    subCategories: [
      {
        id: '2-1',
        subCategoryName: 'Women\'s Clothing',
        categoryCode: 'WOMEN-CLOTHING',
        isActive: true,
        subCategory1s: [
          {
            id: '2-1-1',
            subCategoryName: 'Dresses',
            categoryCode: 'WOMEN-CLOTHING-DRESSES',
            isActive: true
          },
          {
            id: '2-1-2',
            subCategoryName: 'Tops & Blouses',
            categoryCode: 'WOMEN-CLOTHING-TOPS',
            isActive: true
          },
          {
            id: '2-1-3',
            subCategoryName: 'Pants & Leggings',
            categoryCode: 'WOMEN-CLOTHING-PANTS',
            isActive: true
          },
          {
            id: '2-1-4',
            subCategoryName: 'Skirts',
            categoryCode: 'WOMEN-CLOTHING-SKIRTS',
            isActive: true
          }
        ]
      },
      {
        id: '2-2',
        subCategoryName: 'Women\'s Shoes',
        categoryCode: 'WOMEN-SHOES',
        isActive: true,
        subCategory1s: [
          {
            id: '2-2-1',
            subCategoryName: 'Heels',
            categoryCode: 'WOMEN-SHOES-HEELS',
            isActive: true
          },
          {
            id: '2-2-2',
            subCategoryName: 'Flats',
            categoryCode: 'WOMEN-SHOES-FLATS',
            isActive: true
          },
          {
            id: '2-2-3',
            subCategoryName: 'Sneakers',
            categoryCode: 'WOMEN-SHOES-SNEAKERS',
            isActive: true
          },
          {
            id: '2-2-4',
            subCategoryName: 'Boots',
            categoryCode: 'WOMEN-SHOES-BOOTS',
            isActive: true
          }
        ]
      },
      {
        id: '2-3',
        subCategoryName: 'Women\'s Bags',
        categoryCode: 'WOMEN-BAGS',
        isActive: true,
        subCategory1s: [
          {
            id: '2-3-1',
            subCategoryName: 'Handbags',
            categoryCode: 'WOMEN-BAGS-HANDBAGS',
            isActive: true
          },
          {
            id: '2-3-2',
            subCategoryName: 'Backpacks',
            categoryCode: 'WOMEN-BAGS-BACKPACKS',
            isActive: true
          },
          {
            id: '2-3-3',
            subCategoryName: 'Clutches',
            categoryCode: 'WOMEN-BAGS-CLUTCHES',
            isActive: true
          }
        ]
      },
      {
        id: '2-4',
        subCategoryName: 'Women\'s Jewelry',
        categoryCode: 'WOMEN-JEWELRY',
        isActive: true,
        subCategory1s: [
          {
            id: '2-4-1',
            subCategoryName: 'Necklaces',
            categoryCode: 'WOMEN-JEWELRY-NECKLACES',
            isActive: true
          },
          {
            id: '2-4-2',
            subCategoryName: 'Earrings',
            categoryCode: 'WOMEN-JEWELRY-EARRINGS',
            isActive: true
          },
          {
            id: '2-4-3',
            subCategoryName: 'Rings',
            categoryCode: 'WOMEN-JEWELRY-RINGS',
            isActive: true
          },
          {
            id: '2-4-4',
            subCategoryName: 'Bracelets',
            categoryCode: 'WOMEN-JEWELRY-BRACELETS',
            isActive: true
          }
        ]
      }
    ],
    subCategory1s: [
      {
        id: '2-5',
        subCategoryName: 'Women\'s Lingerie',
        categoryCode: 'WOMEN-LINGERIE',
        isActive: true
      },
      {
        id: '2-6',
        subCategoryName: 'Women\'s Activewear',
        categoryCode: 'WOMEN-ACTIVEWEAR',
        isActive: true
      }
    ]
  },
  {
    id: '3',
    categoryName: 'Kids',
    categorySlug: 'kids',
    isActive: true,
    subCategories: [
      {
        id: '3-1',
        subCategoryName: 'Boys Clothing',
        categoryCode: 'KIDS-BOYS-CLOTHING',
        isActive: true,
        subCategory1s: [
          {
            id: '3-1-1',
            subCategoryName: 'Boys T-Shirts',
            categoryCode: 'KIDS-BOYS-CLOTHING-TSHIRTS',
            isActive: true
          },
          {
            id: '3-1-2',
            subCategoryName: 'Boys Pants',
            categoryCode: 'KIDS-BOYS-CLOTHING-PANTS',
            isActive: true
          },
          {
            id: '3-1-3',
            subCategoryName: 'Boys Shorts',
            categoryCode: 'KIDS-BOYS-CLOTHING-SHORTS',
            isActive: true
          }
        ]
      },
      {
        id: '3-2',
        subCategoryName: 'Girls Clothing',
        categoryCode: 'KIDS-GIRLS-CLOTHING',
        isActive: true,
        subCategory1s: [
          {
            id: '3-2-1',
            subCategoryName: 'Girls Dresses',
            categoryCode: 'KIDS-GIRLS-CLOTHING-DRESSES',
            isActive: true
          },
          {
            id: '3-2-2',
            subCategoryName: 'Girls Tops',
            categoryCode: 'KIDS-GIRLS-CLOTHING-TOPS',
            isActive: true
          },
          {
            id: '3-2-3',
            subCategoryName: 'Girls Skirts',
            categoryCode: 'KIDS-GIRLS-CLOTHING-SKIRTS',
            isActive: true
          }
        ]
      },
      {
        id: '3-3',
        subCategoryName: 'Kids Shoes',
        categoryCode: 'KIDS-SHOES',
        isActive: true,
        subCategory1s: [
          {
            id: '3-3-1',
            subCategoryName: 'Sneakers',
            categoryCode: 'KIDS-SHOES-SNEAKERS',
            isActive: true
          },
          {
            id: '3-3-2',
            subCategoryName: 'Sandals',
            categoryCode: 'KIDS-SHOES-SANDALS',
            isActive: true
          }
        ]
      }
    ],
    subCategory1s: [
      {
        id: '3-4',
        subCategoryName: 'Baby Clothing',
        categoryCode: 'KIDS-BABY-CLOTHING',
        isActive: true
      }
    ]
  },
  {
    id: '4',
    categoryName: 'Accessories',
    categorySlug: 'accessories',
    isActive: true,
    subCategories: [
      {
        id: '4-1',
        subCategoryName: 'Watches',
        categoryCode: 'ACCESSORIES-WATCHES',
        isActive: true,
        subCategory1s: [
          {
            id: '4-1-1',
            subCategoryName: 'Smart Watches',
            categoryCode: 'ACCESSORIES-WATCHES-SMART',
            isActive: true
          },
          {
            id: '4-1-2',
            subCategoryName: 'Analog Watches',
            categoryCode: 'ACCESSORIES-WATCHES-ANALOG',
            isActive: true
          },
          {
            id: '4-1-3',
            subCategoryName: 'Digital Watches',
            categoryCode: 'ACCESSORIES-WATCHES-DIGITAL',
            isActive: true
          }
        ]
      },
      {
        id: '4-2',
        subCategoryName: 'Sunglasses',
        categoryCode: 'ACCESSORIES-SUNGLASSES',
        isActive: true,
        subCategory1s: [
          {
            id: '4-2-1',
            subCategoryName: 'Aviator',
            categoryCode: 'ACCESSORIES-SUNGLASSES-AVIATOR',
            isActive: true
          },
          {
            id: '4-2-2',
            subCategoryName: 'Wayfarer',
            categoryCode: 'ACCESSORIES-SUNGLASSES-WAYFARER',
            isActive: true
          },
          {
            id: '4-2-3',
            subCategoryName: 'Sport',
            categoryCode: 'ACCESSORIES-SUNGLASSES-SPORT',
            isActive: true
          }
        ]
      },
      {
        id: '4-3',
        subCategoryName: 'Hats & Caps',
        categoryCode: 'ACCESSORIES-HATS',
        isActive: true,
        subCategory1s: [
          {
            id: '4-3-1',
            subCategoryName: 'Baseball Caps',
            categoryCode: 'ACCESSORIES-HATS-BASEBALL',
            isActive: true
          },
          {
            id: '4-3-2',
            subCategoryName: 'Beanies',
            categoryCode: 'ACCESSORIES-HATS-BEANIES',
            isActive: true
          },
          {
            id: '4-3-3',
            subCategoryName: 'Sun Hats',
            categoryCode: 'ACCESSORIES-HATS-SUN',
            isActive: true
          }
        ]
      }
    ],
    subCategory1s: [
      {
        id: '4-4',
        subCategoryName: 'Phone Cases',
        categoryCode: 'ACCESSORIES-PHONE-CASES',
        isActive: true
      },
      {
        id: '4-5',
        subCategoryName: 'Backpacks',
        categoryCode: 'ACCESSORIES-BACKPACKS',
        isActive: true
      }
    ]
  },
  {
    id: '5',
    categoryName: 'Electronics',
    categorySlug: 'electronics',
    isActive: true,
    subCategories: [
      {
        id: '5-1',
        subCategoryName: 'Mobile Phones',
        categoryCode: 'ELECTRONICS-MOBILE',
        isActive: true,
        subCategory1s: [
          {
            id: '5-1-1',
            subCategoryName: 'Smartphones',
            categoryCode: 'ELECTRONICS-MOBILE-SMARTPHONES',
            isActive: true
          },
          {
            id: '5-1-2',
            subCategoryName: 'Feature Phones',
            categoryCode: 'ELECTRONICS-MOBILE-FEATURE',
            isActive: true
          }
        ]
      },
      {
        id: '5-2',
        subCategoryName: 'Laptops',
        categoryCode: 'ELECTRONICS-LAPTOPS',
        isActive: true,
        subCategory1s: [
          {
            id: '5-2-1',
            subCategoryName: 'Gaming Laptops',
            categoryCode: 'ELECTRONICS-LAPTOPS-GAMING',
            isActive: true
          },
          {
            id: '5-2-2',
            subCategoryName: 'Business Laptops',
            categoryCode: 'ELECTRONICS-LAPTOPS-BUSINESS',
            isActive: true
          },
          {
            id: '5-2-3',
            subCategoryName: 'Ultrabooks',
            categoryCode: 'ELECTRONICS-LAPTOPS-ULTRABOOKS',
            isActive: true
          }
        ]
      },
      {
        id: '5-3',
        subCategoryName: 'Audio',
        categoryCode: 'ELECTRONICS-AUDIO',
        isActive: true,
        subCategory1s: [
          {
            id: '5-3-1',
            subCategoryName: 'Headphones',
            categoryCode: 'ELECTRONICS-AUDIO-HEADPHONES',
            isActive: true
          },
          {
            id: '5-3-2',
            subCategoryName: 'Speakers',
            categoryCode: 'ELECTRONICS-AUDIO-SPEAKERS',
            isActive: true
          },
          {
            id: '5-3-3',
            subCategoryName: 'Earbuds',
            categoryCode: 'ELECTRONICS-AUDIO-EARBUDS',
            isActive: true
          }
        ]
      }
    ],
    subCategory1s: [
      {
        id: '5-4',
        subCategoryName: 'Tablets',
        categoryCode: 'ELECTRONICS-TABLETS',
        isActive: true
      }
    ]
  },
  {
    id: '6',
    categoryName: 'Home & Living',
    categorySlug: 'home-living',
    isActive: true,
    subCategories: [
      {
        id: '6-1',
        subCategoryName: 'Furniture',
        categoryCode: 'HOME-FURNITURE',
        isActive: true,
        subCategory1s: [
          {
            id: '6-1-1',
            subCategoryName: 'Sofas',
            categoryCode: 'HOME-FURNITURE-SOFAS',
            isActive: true
          },
          {
            id: '6-1-2',
            subCategoryName: 'Tables',
            categoryCode: 'HOME-FURNITURE-TABLES',
            isActive: true
          },
          {
            id: '6-1-3',
            subCategoryName: 'Chairs',
            categoryCode: 'HOME-FURNITURE-CHAIRS',
            isActive: true
          }
        ]
      },
      {
        id: '6-2',
        subCategoryName: 'Decor',
        categoryCode: 'HOME-DECOR',
        isActive: true,
        subCategory1s: [
          {
            id: '6-2-1',
            subCategoryName: 'Wall Art',
            categoryCode: 'HOME-DECOR-WALL-ART',
            isActive: true
          },
          {
            id: '6-2-2',
            subCategoryName: 'Vases',
            categoryCode: 'HOME-DECOR-VASES',
            isActive: true
          },
          {
            id: '6-2-3',
            subCategoryName: 'Candles',
            categoryCode: 'HOME-DECOR-CANDLES',
            isActive: true
          }
        ]
      },
      {
        id: '6-3',
        subCategoryName: 'Kitchen',
        categoryCode: 'HOME-KITCHEN',
        isActive: true,
        subCategory1s: [
          {
            id: '6-3-1',
            subCategoryName: 'Cookware',
            categoryCode: 'HOME-KITCHEN-COOKWARE',
            isActive: true
          },
          {
            id: '6-3-2',
            subCategoryName: 'Dinnerware',
            categoryCode: 'HOME-KITCHEN-DINNERWARE',
            isActive: true
          },
          {
            id: '6-3-3',
            subCategoryName: 'Utensils',
            categoryCode: 'HOME-KITCHEN-UTENSILS',
            isActive: true
          }
        ]
      }
    ],
    subCategory1s: [
      {
        id: '6-4',
        subCategoryName: 'Bedding',
        categoryCode: 'HOME-BEDDING',
        isActive: true
      }
    ]
  }
];

/**
 * Get mock categories formatted for API response
 */
export const getMockCategories = () => {
  return mockCategories;
};

/**
 * Get mock category by ID
 */
export const getMockCategoryById = (id) => {
  return mockCategories.find(cat => cat.id === id);
};

/**
 * Get mock subcategory by ID
 */
export const getMockSubCategoryById = (id) => {
  for (const category of mockCategories) {
    const subCategory = category.subCategories?.find(sub => sub.id === id);
    if (subCategory) return subCategory;
  }
  return null;
};

/**
 * Get mock subcategory1 by ID
 */
export const getMockSubCategory1ById = (id) => {
  // Check in subCategory1s arrays within categories
  for (const category of mockCategories) {
    const subCategory1 = category.subCategory1s?.find(sub1 => sub1.id === id);
    if (subCategory1) return subCategory1;
    
    // Check in subCategory1s within subCategories
    for (const subCategory of category.subCategories || []) {
      const subCategory1 = subCategory.subCategory1s?.find(sub1 => sub1.id === id);
      if (subCategory1) return subCategory1;
    }
  }
  return null;
};

