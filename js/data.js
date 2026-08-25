const APP_DATA = {
  appName: "مطاعم النعمانية",
  currency: "د.ع",
  neighborhoods: [
    { id: 'n1', name: 'حي المعلمين', fee: 2000 },
    { id: 'n2', name: 'حي الربيع', fee: 2000 },
    { id: 'n3', name: 'حي السراي', fee: 1500 },
    { id: 'n4', name: 'الشارع العام / السوق', fee: 1500 },
    { id: 'n5', name: 'حي العسكري', fee: 2500 }
  ],
  categories: [
    { id: 'all', name: 'الكل', icon: 'fa-border-all' },
    { id: 'mandi', name: 'مندي وقوزي', icon: 'fa-utensils' },
    { id: 'grills', name: 'مشاوي وكباب', icon: 'fa-drumstick-bite' },
    { id: 'shawarma', name: 'شاورما وصاج', icon: 'fa-bread-slice' },
    { id: 'burger', name: 'برجر وسريع', icon: 'fa-burger' },
    { id: 'pizza', name: 'بيتزا وفطاير', icon: 'fa-pizza-slice' },
    { id: 'fish', name: 'سمك مسكوف', icon: 'fa-fish' },
    { id: 'drinks', name: 'عصائر وكافيه', icon: 'fa-mug-hot' },
    { id: 'sweets', name: 'حلويات وكنافة', icon: 'fa-ice-cream' }
  ],
  restaurants: [
    {
      id: 'r1',
      name: 'مطبخ وحنيذ الشيوخ',
      category: 'mandi',
      rating: 4.9,
      ratingCount: 520,
      deliveryTime: '25-35 دقيقة',
      deliveryFee: '2,000 د.ع',
      badge: 'مندي أصيل',
      image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
      cover: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80',
      description: 'متخصصون في المندي العراقي، حنيذ اللحم، والقوزي على تمن البسمتي.',
      menu: [
        {
          id: 'm101',
          name: 'وجبة مندي لحم غنم سبيشل',
          description: 'لحم غنم طازج محمر مع رز مندي بسمتي فاخر والمكسرات.',
          price: 14000,
          image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
          popular: true
        },
        {
          id: 'm102',
          name: 'صينية قوزي الشيوخ (نفرين)',
          description: 'كتف غنم بلدي محمر مع رز أحمر وأصفر ومقبلات مشكلة.',
          price: 26000,
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
          popular: true
        }
      ]
    },
    {
      id: 'r2',
      name: 'كباب وكاساس النعمانية',
      category: 'grills',
      rating: 4.8,
      ratingCount: 380,
      deliveryTime: '20-30 دقيقة',
      deliveryFee: '2,000 د.ع',
      badge: 'مشاوي عادية وفحم',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      description: 'أجود أنواع الكباب العراقي والمشاوي المشكلة على الفحم الطبيعي.',
      menu: [
        {
          id: 'm201',
          name: 'نفر كباب لحم بلدي (4 شيش)',
          description: 'كباب لحم غنم عراقي مشوي على الفحم مع الخبز الحار والطماطم.',
          price: 10000,
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
          popular: true
        }
      ]
    },
    {
      id: 'r3',
      name: 'شاورما وصاج الفراشة',
      category: 'shawarma',
      rating: 4.7,
      ratingCount: 410,
      deliveryTime: '15-25 دقيقة',
      deliveryFee: '1,500 د.ع',
      badge: 'شاورما وصاج',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
      cover: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=1200&q=80',
      description: 'شاورما عراقي دبل ومشروبات وصاج كلاسيك مع صوصات خاصة.',
      menu: [
        {
          id: 'm301',
          name: 'وجبة صاج شاورما عربي دبل',
          description: 'شاورما لحم بلدي محشوة مع بطاطس ومخلل وصوص الثوم الفاخر.',
          price: 7000,
          image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80',
          popular: true
        }
      ]
    },
    {
      id: 'r4',
      name: 'مسكوف دجلة النعمانية',
      category: 'fish',
      rating: 4.9,
      ratingCount: 290,
      deliveryTime: '35-45 دقيقة',
      deliveryFee: 'مجاناً',
      badge: 'سمك مسكوف',
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      cover: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
      description: 'سمك مسكوف حطب عراقي من نهر دجلة طازج يومياً.',
      menu: [
        {
          id: 'm501',
          name: 'كيلو سمك مسكوف حطب',
          description: 'سمك بني أو كطان عراقي مسكوف على الخشب مع التوشيح والعنبة.',
          price: 16000,
          image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
          popular: true
        }
      ]
    }
  ]
};
