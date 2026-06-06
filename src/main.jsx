import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// تحميل Pi SDK تلقائياً
if (typeof window !== 'undefined' && !window.Pi) {
  const script = document.createElement('script');
  script.src = "https://sdk.minepi.com/pi-sdk.js";
  script.async = true;
  document.head.appendChild(script);
}

const INITIAL_SERVICES = [
  {
    id: 1,
    title: "تصميم شعار احترافي بهوية بصرية كاملة",
    titleEn: "Professional Logo & Brand Identity Design",
    description: "أصمم لك شعاراً مبتكراً يناسب مشروعك مع تسليم الملفات المصدرية بجودة عالية.",
    descriptionEn: "I will design an innovative logo for your project with high-quality source files.",
    seller: "CreativePioneer",
    price: 15,
    category: "Design",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500"
  },
  {
    id: 2,
    title: "ترجمة احترافية للمقالات من الإنجليزية للعربية",
    titleEn: "Professional Article Translation (EN to AR)",
    description: "ترجمة يدوية دقيقة خالية من الأخطاء اللغوية لـ 1000 كلمة.",
    descriptionEn: "Accurate manual translation free of linguistic errors for 1000 words.",
    seller: "ArTranslator",
    price: 10,
    category: "Writing",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500"
  }
];

export default function App() {
  const [lang, setLang] = useState('ar');
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [currentTab, setCurrentTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState('home');
  const [selectedService, setSelectedService] = useState(null);

  const [newService, setNewService] = useState({
    title: '', titleEn: '', description: '', descriptionEn: '', price: '', category: 'Design', image: ''
  });

  useEffect(() => {
    const storedServices = localStorage.getItem('pigigs_services');
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    } else {
      localStorage.setItem('pigigs_services', JSON.stringify(INITIAL_SERVICES));
      setServices(INITIAL_SERVICES);
    }
    const storedUser = localStorage.getItem('pigigs_user');
    if (storedUser) setUser(JSON.parse(storedUser));

    if (window.Pi) {
      try {
        window.Pi.init({ version: "2.0", sandbox: true });
      } catch (e) {
        console.log("Pi Init:", e);
      }
    }
  }, []);

  const handlePiLogin = () => {
    if (window.Pi) {
      const scopes = ['username', 'payments'];
      function onIncompletePaymentFound(payment) {
        console.log('Incomplete payment:', payment);
      }

      window.Pi.authenticate(scopes, onIncompletePaymentFound)
      .then(function(auth) {
          const userData = { username: auth.user.username };
          setUser(userData);
          localStorage.setItem('pigigs_user', JSON.stringify(userData));
        })
      .catch(function(error) {
          console.error(error);
          alert(lang === 'ar'? 'فشل الاتصال بشبكة Pi' : 'Pi Authentication failed');
        });
    } else {
      const demoUser = { username: "DemoUser" };
      setUser(demoUser);
      localStorage.setItem('pigigs_user', JSON.stringify(demoUser));
    }
  };

  const handlePiPayment = (service) => {
    if (!user) {
      alert(lang === 'ar'? 'الرجاء تسجيل الدخول أولاً عبر Pi' : 'Please login first via Pi');
      return;
    }

    if (window.Pi) {
      window.Pi.createPayment({
        amount: service.price,
        memo: `PiGigs: ${service.titleEn}`,
        metadata: { serviceId: service.id },
      }, {
        onReadyForServerApproval: async function(paymentId) {
          console.log("Payment Ready for Approval:", paymentId);
        },
        onReadyForServerCompletion: function(paymentId, txid) {
          console.log("Payment Completed:", paymentId, txid);
          alert(lang === 'ar'? 'تم الدفع بنجاح! تواصل مع البائع.' : 'Payment completed successfully!');
        },
        onCancel: function(paymentId) {
          alert(lang === 'ar'? 'تم إلغاء عملية الدفع' : 'Payment cancelled');
        },
        onError: function(error) {
          console.error('Pi Payment Error:', error);
          alert(lang === 'ar'? 'فشل في إتمام الدفع' : 'Payment error occurred');
        }
      });
    } else {
      alert(lang === 'ar'
      ? `[وضع تجريبي] تم إرسال ${service.price} Pi للبائع @${service.seller}`
        : `[Demo Mode] Sent ${service.price} Pi to @${service.seller}`
      );
    }
  };

  const handleCreateService = (e) => {
    e.preventDefault();
    if (!user) return;

    const created = {
      id: Date.now(),
    ...newService,
      price: parseFloat(newService.price),
      seller: user.username,
      image: newService.image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500"
    };

    const updated = [created,...services];
    setServices(updated);
    localStorage.setItem('pigigs_services', JSON.stringify(updated));

    alert(lang === 'ar'? 'تم نشر خدمتك بنجاح!' : 'Service published successfully!');
    setActivePage('home');
    setNewService({ title: '', titleEn: '', description: '', descriptionEn: '', price: '', category: 'Design', image: '' });
  };

  const filteredServices = services.filter(s => {
    const matchesTab = currentTab === 'All' || s.category === currentTab;
    const matchesSearch = (lang === 'ar'? s.title : s.titleEn).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className={`min-h-screen bg-gray-50 font-sans pb-24 ${lang === 'ar'? 'rtl text-right' : 'ltr text-left'}`} style={{ direction: lang === 'ar'? 'rtl' : 'ltr' }}>

      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setActivePage('home')}>
            <span className="text-2xl font-black text-[#6F00FF]">Pi</span>
            <span className="text-xl font-bold text-gray-800">Gigs</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ar'? 'en' : 'ar')}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded border"
            >
              {lang === 'ar'? 'English' : 'العربية'}
            </button>

            {user? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-purple-50 text-[#6F00FF] px-2.5 py-1 rounded-full border-purple-200">
                  @{user.username}
                </span>
                <button
                  onClick={() => setActivePage('sell')}
                  className="bg-[#6F00FF] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
                >
                  {lang === 'ar'? '+ أضف خدمة' : '+ Add Gig'}
                </button>
              </div>
            ) : (
              <button
                onClick={handlePiLogin}
                className="bg-[#6F00FF] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm"
              >
                {lang === 'ar'? 'الدخول بواسطة Pi' : 'Login with Pi'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {activePage === 'home' && (
          <div>
            <div className="mb-6 text-center py-6 bg-gradient-to-br from-purple-50 to-white rounded-2xl p-4 border-purple-100">
              <h1 className="text-lg font-extrabold text-gray-800 mb-1">
                {lang === 'ar'? 'سوق الخدمات المصغرة لمجتمع Pi' : 'Microservices Marketplace for Pi Community'}
              </h1>
              <p className="text- text-gray-500 mb-4">
                {lang === 'ar'? 'وظّف مبدعين عالميين وادفع بأمان عبر عملة Pi' : 'Hire global creators and pay securely via Pi Coin'}
              </p>
              <input
                type="text"
                placeholder={lang === 'ar'? 'ابحث عن خدمات...' : 'Search for services...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md px-4 py-2 text-sm rounded-xl border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6F00FF] text-center bg-white"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
              {['All', 'Design', 'Writing', 'Programming', 'Digital Products'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    currentTab === tab? 'bg-[#6F00FF] text-white' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {lang === 'ar'? (
                    tab === 'All'? 'الكل' : tab === 'Design'? 'تصميم' : tab === 'Writing'? 'كتابة وترجمة' : tab === 'Programming'? 'برمجة' : 'منتجات رقمية'
                  ) : tab}
                </button>
              ))}
            </div>

            {filteredServices.length === 0? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {lang === 'ar'? 'لا توجد خدمات متاحة.' : 'No services available.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => { setSelectedService(service); setActivePage('detail'); }}
                    className="bg-white rounded-xl shadow-sm border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition flex-col justify-between"
                  >
                    <div>
                      <img src={service.image} alt="Gig" className="w-full h-36 object-cover" />
                      <div className="p-4">
                        <span className="text- bg-purple-50 text-[#6F00FF] font-bold px-2 py-0.5 rounded">
                          {service.category}
                        </span>
                        <h3 className="font-bold text-gray-800 text-sm mt-2 line-clamp-2">
                          {lang === 'ar'? service.title : service.titleEn}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {lang === 'ar'? service.description : service.descriptionEn}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <span className="text-xs text-gray-400">@{service.seller}</span>
                      <span className="text-sm font-black text-[#6F00FF]">{service.price} Pi</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activePage === 'detail' && selectedService && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border-gray-100">
            <button onClick={() => setActivePage('home')} className="text-xs text-[#6F00FF] font-bold mb-4 flex items-center gap-1">
              {lang === 'ar'? '← العودة للرئيسية' : '← Back to Home'}
            </button>
            <img src={selectedService.image} alt="img" className="w-full h-48 sm:h-64 object-cover rounded-xl mb-4" />
            <div className="flex justify-between items-start gap-2 mb-2">
              <h2 className="text-base font-bold text-gray-800">{lang === 'ar'? selectedService.title : selectedService.titleEn}</h2>
              <span class
