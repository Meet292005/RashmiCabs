// Route Database (Distance in Kms)
const distances = {
  "Bhavnagar-Ahmedabad": 170,
  "Bhavnagar-Ahmedabad Airport": 175,
  "Bhavnagar-Baroda": 200,
  "Bhavnagar-Surat": 320,
  "Bhavnagar-Rajkot": 180,
  "Bhavnagar-Diu": 220,
  "Bhavnagar-Somnath": 280,
  "Bhavnagar-Dwarka": 380,
  "Bhavnagar-Mumbai": 760,
  // Other combinations
  "Ahmedabad-Baroda": 120,
  "Ahmedabad-Surat": 260,
  "Ahmedabad-Rajkot": 220,
  "Baroda-Surat": 150,
  "Baroda-Rajkot": 290,
  "Surat-Rajkot": 440
};

// Rates definition
const pricingRates = {
  oneway: {
    sedan: 16.5,  // Rs per km (One-way rate is higher as it accounts for single trip return cost)
    suv: 21.0,
    premium: 28.0
  },
  roundtrip: {
    sedan: 11.0,  // Rs per km (Standard outstation round trip rate)
    suv: 14.0,
    premium: 18.0
  }
};

let currentTripType = 'oneway';

// Set Trip Type (One-way vs Round-trip)
function setTripType(type) {
  currentTripType = type;
  
  // Manage tab button states
  const oneWayBtn = document.getElementById('tabOneWay');
  const roundTripBtn = document.getElementById('tabRoundTrip');
  
  if (type === 'oneway') {
    oneWayBtn.classList.add('active');
    roundTripBtn.classList.remove('active');
  } else {
    roundTripBtn.classList.add('active');
    oneWayBtn.classList.remove('active');
  }
  
  // Re-calculate if drop city is already selected
  const dropCitySelect = document.getElementById('dropCity');
  if (dropCitySelect.value) {
    calculateFare(new Event('submit'));
  }
}

// Get distance helper
function getDistance(pickup, drop) {
  if (pickup === drop) return 0;
  
  const key1 = `${pickup}-${drop}`;
  const key2 = `${drop}-${pickup}`;
  
  if (distances[key1]) return distances[key1];
  if (distances[key2]) return distances[key2];
  
  // Defaults if route not found
  return 150; 
}

// Triggered when route changes
function onRouteChanged() {
  // Hide results if selections change until calculated again
  document.getElementById('resultsPanel').classList.add('hidden');
}

// Calculate Fare function
function calculateFare(event) {
  if (event) event.preventDefault();
  
  const pickup = document.getElementById('pickupCity').value;
  const drop = document.getElementById('dropCity').value;
  const travelDate = document.getElementById('travelDate').value;
  const travelTime = document.getElementById('travelTime').value;
  
  if (!pickup || !drop) {
    alert("Please select both pickup and drop cities.");
    return;
  }
  
  const distance = getDistance(pickup, drop);
  if (distance === 0) {
    alert("Pickup and Drop locations cannot be the same.");
    return;
  }
  
  const rates = pricingRates[currentTripType];
  let calculatedDistance = distance;
  
  // Round trip implies double the distance
  if (currentTripType === 'roundtrip') {
    calculatedDistance = distance * 2;
  }
  
  // Calculate pricing estimates
  let sedanPrice = Math.round(calculatedDistance * rates.sedan);
  let suvPrice = Math.round(calculatedDistance * rates.suv);
  let premiumPrice = Math.round(calculatedDistance * rates.premium);
  
  // Apply base minimal pricing (covers driver starting rules if short distances)
  if (currentTripType === 'oneway') {
    sedanPrice = Math.max(sedanPrice, 2000);
    suvPrice = Math.max(suvPrice, 2800);
    premiumPrice = Math.max(premiumPrice, 4000);
  } else {
    // Add flat driver allowance per day for round trips
    sedanPrice += 300;
    suvPrice += 300;
    premiumPrice += 400;
  }
  
  displayResults(pickup, drop, travelDate, travelTime, distance, sedanPrice, suvPrice, premiumPrice);
}

// Display results function
function displayResults(pickup, drop, date, time, distance, sedan, suv, premium) {
  const container = document.getElementById('carCardsContainer');
  container.innerHTML = ''; // Clear previous
  
  const tripLabel = currentTripType === 'oneway' ? 'One-Way Drop' : 'Round Trip';
  const distanceLabel = currentTripType === 'oneway' ? `${distance} Km` : `${distance * 2} Km (including return)`;
  
  const cars = [
    {
      name: "Premium Sedan",
      desc: "Swift Dzire, Hyundai Aura, Etios",
      price: sedan,
      class: "sedan",
      waText: `Hi Rashmi Cabs, I want to book a Sedan for a ${tripLabel} from ${pickup} to ${drop} on ${date} at ${time}. Estimated price is ₹${sedan}.`
    },
    {
      name: "Comfort SUV",
      desc: "Maruti Suzuki Ertiga",
      price: suv,
      class: "suv",
      waText: `Hi Rashmi Cabs, I want to book an Ertiga SUV for a ${tripLabel} from ${pickup} to ${drop} on ${date} at ${time}. Estimated price is ₹${suv}.`
    },
    {
      name: "Luxury MVP",
      desc: "Toyota Innova Crysta",
      price: premium,
      class: "premium",
      waText: `Hi Rashmi Cabs, I want to book an Innova Crysta for a ${tripLabel} from ${pickup} to ${drop} on ${date} at ${time}. Estimated price is ₹${premium}.`
    }
  ];
  
  cars.forEach(car => {
    const card = document.createElement('div');
    card.className = 'result-car-card';
    
    const urlEncodedText = encodeURIComponent(car.waText);
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=%2B919974234111&text=${urlEncodedText}`;
    
    card.innerHTML = `
      <div class="car-details">
        <h4>${car.name}</h4>
        <p>${car.desc} (${tripLabel})</p>
        <p style="font-size: 11px; margin-top: 4px; color: var(--text-muted);"><i class="fa-solid fa-road"></i> Est: ${distanceLabel}</p>
      </div>
      <div class="car-pricing-action">
        <span class="est-price">₹${car.price.toLocaleString('en-IN')}</span>
        <a href="${whatsappUrl}" target="_blank" class="btn-book-whatsapp" aria-label="Book ${car.name} on WhatsApp">
          <i class="fa-brands fa-whatsapp"></i>
        </a>
      </div>
    `;
    
    container.appendChild(card);
  });
  
  // Show the results panel with smooth scroll
  const resultsPanel = document.getElementById('resultsPanel');
  resultsPanel.classList.remove('hidden');
  
  // Scroll down a little bit so details are in view
  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Popular route auto-booking handler
function bookQuickRoute(pickup, drop) {
  document.getElementById('pickupCity').value = pickup;
  document.getElementById('dropCity').value = drop;
  
  // Auto set current date and time
  const dateInput = document.getElementById('travelDate');
  const timeInput = document.getElementById('travelTime');
  
  const now = new Date();
  // Set tomorrow as default date
  now.setDate(now.getDate() + 1);
  const tomorrowStr = now.toISOString().split('T')[0];
  dateInput.value = tomorrowStr;
  timeInput.value = "08:00"; // standard default booking morning slot
  
  // Always scroll to home/estimator first
  document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
  
  // Trigger Tab
  setTripType('oneway');
  
  // Execute estimation after a tiny delay to allow scrolling
  setTimeout(() => {
    calculateFare(new Event('submit'));
  }, 500);
}

// DOM Setup & Navigation Scroll Events
document.addEventListener('DOMContentLoaded', () => {
  // Set default values for Travel Date & Time
  const dateInput = document.getElementById('travelDate');
  const timeInput = document.getElementById('travelTime');
  
  if (dateInput && timeInput) {
    const today = new Date();
    // Pre-fill with today's date
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    dateInput.min = `${yyyy}-${mm}-${dd}`; // Cannot book past dates
    
    // Pre-fill time with current time rounded to next hour
    let hours = today.getHours() + 1;
    if (hours > 23) hours = 0;
    const hoursStr = String(hours).padStart(2, '0');
    timeInput.value = `${hoursStr}:00`;
  }
  
  // Scroll Reveal Observer
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    };
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback for browsers without IntersectionObserver
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  // Navbar Sticky & Scroll Car Track Progress Animation
  const header = document.querySelector('.header');
  const roadCarWrapper = document.getElementById('roadCarWrapper');

  function updateScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (scrollHeight > 0 && roadCarWrapper) {
      const scrollPercent = Math.min(Math.max((scrollTop / scrollHeight) * 100, 0), 100);
      roadCarWrapper.style.left = `${scrollPercent}%`;
    }

    if (header) {
      if (scrollTop > 50) {
        header.style.boxShadow = 'var(--shadow)';
        header.style.background = 'rgba(10, 11, 16, 0.95)';
      } else {
        header.style.boxShadow = 'none';
        header.style.background = 'rgba(10, 11, 16, 0.85)';
      }
    }

    // Dynamic Active Nav Links on Scroll
    const sections = document.querySelectorAll('section, footer');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
        currentId = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress(); // Initial check
  
  // Hamburger Menu Actions
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  
  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
    
    // Close nav on menu links click
    const menuLinks = document.querySelectorAll('.nav-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }
  
  // Accordion Actions
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const parent = question.parentElement;
      const isActive = parent.classList.contains('active');
      
      // Close all first
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.faq-answer').style.maxHeight = null;
      });
      
      // If was not active, open it
      if (!isActive) {
        parent.classList.add('active');
        const answer = parent.querySelector('.faq-answer');
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
});
