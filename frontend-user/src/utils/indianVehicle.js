// Indian Vehicle Registration Number Formatter, Validator & RTO Intelligence Helper

// Common Indian State and Union Territory Codes
export const INDIAN_STATES_RTO = {
  'AP': {
    name: 'Andhra Pradesh',
    rtos: {
      '31': 'Visakhapatnam',
      '32': 'Anakapalli',
      '33': 'Gajuwaka (Visakhapatnam)',
      '34': 'Bheemunipatnam',
      '39': 'Vizianagaram',
      '05': 'Kakinada',
      '07': 'Guntur',
      '16': 'Vijayawada',
      '21': 'Tirupati',
      '26': 'Nellore',
      '02': 'Anantapur',
      '03': 'Chittoor',
      '04': 'Kadapa',
      '09': 'Eluru',
      '13': 'Rajahmundry',
      '27': 'Ongole',
      '30': 'Srikakulam'
    }
  },
  'TS': {
    name: 'Telangana',
    rtos: {
      '09': 'Hyderabad Central (Khairatabad)',
      '10': 'Secunderabad',
      '11': 'Hyderabad East (Malakpet)',
      '12': 'Hyderabad South (Kishanbagh)',
      '13': 'Hyderabad West (Tolichowki)',
      '07': 'Ranga Reddy (Attapur)',
      '08': 'Medchal-Malkajgiri',
      '01': 'Adilabad',
      '02': 'Karimnagar',
      '03': 'Warangal',
      '04': 'Khammam',
      '05': 'Nalgonda',
      '06': 'Mahabubnagar'
    }
  },
  'DL': {
    name: 'Delhi NCR',
    rtos: {
      '01': 'Mall Road (North Delhi)',
      '02': 'IP Estate (New Delhi)',
      '03': 'Sheikh Sarai (South Delhi)',
      '04': 'Janakpuri (West Delhi)',
      '05': 'Loni Road (North East Delhi)',
      '06': 'Sarai Kale Khan (Central Delhi)',
      '07': 'Mayur Vihar (East Delhi)',
      '08': 'Wazirpur (North West Delhi)',
      '09': 'Palam (South West Delhi)',
      '10': 'Raja Garden (West Delhi)',
      '11': 'Rohini (North West Delhi)',
      '12': 'Vasant Vihar (South West Delhi)',
      '13': 'Surajmal Vihar (East Delhi)',
      '14': 'Dwarka (South West Delhi)'
    }
  },
  'MH': {
    name: 'Maharashtra',
    rtos: {
      '01': 'Mumbai Central (Tardeo)',
      '02': 'Mumbai West (Andheri)',
      '03': 'Mumbai East (Wadala)',
      '47': 'Mumbai North (Borivali)',
      '04': 'Thane',
      '05': 'Kalyan',
      '12': 'Pune Central',
      '14': 'Pimpri-Chinchwad',
      '31': 'Nagpur',
      '43': 'Navi Mumbai (Vashi)',
      '46': 'Navi Mumbai (Panvel)'
    }
  },
  'KA': {
    name: 'Karnataka',
    rtos: {
      '01': 'Bengaluru Central (Koramangala)',
      '02': 'Bengaluru West (Rajajinagar)',
      '03': 'Bengaluru East (Indiranagar)',
      '04': 'Bengaluru North (Yeshwanthpur)',
      '05': 'Bengaluru South (Jayanagar)',
      '41': 'Bengaluru (Jnanabharathi)',
      '50': 'Bengaluru (Yelahanka)',
      '51': 'Bengaluru (Electronics City)',
      '53': 'Bengaluru (K.R. Puram)',
      '09': 'Mysuru',
      '19': 'Mangaluru',
      '25': 'Dharwad / Hubballi'
    }
  },
  'TN': {
    name: 'Tamil Nadu',
    rtos: {
      '01': 'Chennai Central (Ayanavaram)',
      '02': 'Chennai North West (Anna Nagar)',
      '03': 'Chennai North East (Tondiarpet)',
      '04': 'Chennai East (Royapuram)',
      '05': 'Chennai North (Kolathur)',
      '06': 'Chennai South East (Mandavelli)',
      '07': 'Chennai South (Thiruvanmiyur)',
      '09': 'Chennai West (K.K. Nagar)',
      '10': 'Chennai South West (Virugambakkam)',
      '38': 'Coimbatore',
      '58': 'Madurai',
      '45': 'Tiruchirappalli'
    }
  },
  'KL': {
    name: 'Kerala',
    rtos: {
      '01': 'Thiruvananthapuram',
      '07': 'Kochi / Ernakulam',
      '11': 'Kozhikode',
      '08': 'Thrissur',
      '14': 'Kasaragod'
    }
  },
  'GJ': {
    name: 'Gujarat',
    rtos: {
      '01': 'Ahmedabad',
      '05': 'Surat',
      '06': 'Vadodara',
      '03': 'Rajkot',
      '18': 'Gandhinagar'
    }
  },
  'UP': {
    name: 'Uttar Pradesh',
    rtos: {
      '16': 'Noida (Gautam Buddha Nagar)',
      '14': 'Ghaziabad',
      '32': 'Lucknow',
      '78': 'Kanpur',
      '80': 'Agra',
      '70': 'Varanasi',
      '65': 'Prayagraj'
    }
  },
  'HR': {
    name: 'Haryana',
    rtos: {
      '26': 'Gurugram',
      '51': 'Faridabad',
      '03': 'Panchkula',
      '10': 'Sonipat',
      '06': 'Panipat'
    }
  },
  'WB': {
    name: 'West Bengal',
    rtos: {
      '01': 'Kolkata (Beltala)',
      '02': 'Kolkata (Beltala)',
      '20': 'Howrah',
      '26': 'Barasat (North 24 Parganas)',
      '74': 'Siliguri'
    }
  },
  'RJ': {
    name: 'Rajasthan',
    rtos: {
      '14': 'Jaipur South',
      '45': 'Jaipur North',
      '19': 'Jodhpur',
      '27': 'Udaipur',
      '20': 'Kota'
    }
  },
  'PB': {
    name: 'Punjab',
    rtos: {
      '02': 'Amritsar',
      '08': 'Jalandhar',
      '10': 'Ludhiana',
      '65': 'Mohali (SAS Nagar)'
    }
  },
  'OD': {
    name: 'Odisha',
    rtos: {
      '02': 'Bhubaneswar',
      '05': 'Cuttack',
      '10': 'Rourkela',
      '14': 'Rupadei / Puri',
      '15': 'Sambalpur',
      '07': 'Ganjam (Berhampur)'
    }
  },
  'OR': {
    name: 'Odisha (Old)',
    rtos: {
      '02': 'Bhubaneswar',
      '05': 'Cuttack'
    }
  },
  'MP': {
    name: 'Madhya Pradesh',
    rtos: {
      '04': 'Bhopal',
      '09': 'Indore',
      '20': 'Jabalpur',
      '07': 'Gwalior'
    }
  },
  'CH': { name: 'Chandigarh', rtos: { '01': 'Chandigarh' } },
  'GA': { name: 'Goa', rtos: { '07': 'Panaji', '08': 'Margao' } },
  'BR': { name: 'Bihar', rtos: { '01': 'Patna', '06': 'Muzaffarpur' } },
  'JH': { name: 'Jharkhand', rtos: { '01': 'Ranchi', '05': 'Jamshedpur' } },
  'CG': { name: 'Chhattisgarh', rtos: { '04': 'Raipur', '07': 'Durg' } },
  'AS': { name: 'Assam', rtos: { '01': 'Guwahati' } },
  'UK': { name: 'Uttarakhand', rtos: { '07': 'Dehradun', '04': 'Nainital' } },
  'UA': { name: 'Uttarakhand (Old)', rtos: { '07': 'Dehradun' } },
  'HP': { name: 'Himachal Pradesh', rtos: { '01': 'Shimla' } },
  'JK': { name: 'Jammu & Kashmir', rtos: { '01': 'Srinagar', '02': 'Jammu' } },
  'LA': { name: 'Ladakh', rtos: { '01': 'Leh', '02': 'Kargil' } },
  'PY': { name: 'Puducherry', rtos: { '01': 'Puducherry' } },
  'TR': { name: 'Tripura', rtos: { '01': 'Agartala' } },
  'ML': { name: 'Meghalaya', rtos: { '05': 'Shillong' } },
  'MN': { name: 'Manipur', rtos: { '01': 'Imphal' } },
  'MZ': { name: 'Mizoram', rtos: { '01': 'Aizawl' } },
  'NL': { name: 'Nagaland', rtos: { '01': 'Kohima' } },
  'SK': { name: 'Sikkim', rtos: { '01': 'Gangtok' } },
  'AR': { name: 'Arunachal Pradesh', rtos: { '01': 'Itanagar' } },
  'AN': { name: 'Andaman & Nicobar', rtos: { '01': 'Port Blair' } },
  'DN': { name: 'Dadra & Nagar Haveli', rtos: { '09': 'Silvassa' } },
  'DD': { name: 'Daman & Diu', rtos: { '02': 'Diu', '03': 'Daman' } },
  'LD': { name: 'Lakshadweep', rtos: { '01': 'Kavaratti' } }
};

/**
 * Format raw input as Indian car registration number with auto-dashes.
 * Supports:
 *  1. Standard series: XX-XX-XX-XXXX (e.g. AP-31-EA-1234, TS-09-AB-1234)
 *  2. Standard series 1-letter: XX-XX-X-XXXX (e.g. AP-31-E-1234, DL-01-A-1234)
 *  3. Bharat Series (BH): YY-BH-####-XX (e.g. 22-BH-1234-AA, 23-BH-5678-B)
 */
export const formatIndianCarNumber = (input) => {
  if (!input) return '';
  const raw = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!raw) return '';

  // 1. Bharat Series (starts with 2 digits year: e.g. 21, 22, 23, 24, 25, 26)
  if (/^\d/.test(raw)) {
    const limited = raw.slice(0, 10);
    const year = limited.slice(0, 2);
    const afterYear = limited.slice(2);
    if (!afterYear) return year;

    // Next up to 2 letters (typically BH)
    const lettersMatch = afterYear.match(/^[A-Z]{1,2}/);
    if (!lettersMatch) {
      return `${year}-${afterYear}`;
    }
    const bh = lettersMatch[0];
    const afterBh = afterYear.slice(bh.length);
    if (!afterBh) return `${year}-${bh}`;

    // Next up to 4 digits
    const digitsMatch = afterBh.match(/^\d{1,4}/);
    if (!digitsMatch) {
      return `${year}-${bh}-${afterBh}`;
    }
    const digits = digitsMatch[0];
    const afterDigits = afterBh.slice(digits.length);
    if (!afterDigits) return `${year}-${bh}-${digits}`;

    // Next up to 2 letters
    const endLetters = afterDigits.slice(0, 2);
    return `${year}-${bh}-${digits}-${endLetters}`;
  }

  // 2. Standard State Series (starts with 2 letters: e.g. AP, TS, DL, MH, etc.)
  const stateMatch = raw.match(/^[A-Z]{1,2}/);
  if (!stateMatch) return raw;

  const state = stateMatch[0];
  const afterState = raw.slice(state.length);
  if (!afterState) return state;

  // Next up to 2 digits for RTO code
  const rtoMatch = afterState.match(/^\d{1,2}/);
  if (!rtoMatch) {
    return `${state}-${afterState.slice(0, 2)}`;
  }
  const rto = rtoMatch[0];
  const afterRto = afterState.slice(rto.length);
  if (!afterRto) return `${state}-${rto}`;

  // Next up to 2 letters for Series code
  const seriesMatch = afterRto.match(/^[A-Z]{1,2}/);
  if (!seriesMatch) {
    // If user entered digits directly after RTO
    return `${state}-${rto}-${afterRto.slice(0, 4)}`;
  }
  const series = seriesMatch[0];
  const afterSeries = afterRto.slice(series.length);
  if (!afterSeries) return `${state}-${rto}-${series}`;

  // Next up to 4 digits for Number
  const number = afterSeries.replace(/[^0-9]/g, '').slice(0, 4);
  return `${state}-${rto}-${series}-${number}`;
};

/**
 * Validates whether the car number matches accepted Indian standards:
 * - XX-XX-XX-XXXX or XX-XX-X-XXXX
 * - YY-BH-####-XX or YY-BH-####-X
 */
export const validateIndianCarNumber = (input) => {
  if (!input) {
    return {
      isValid: false,
      message: 'Please enter a valid car registration number.'
    };
  }

  const formatted = formatIndianCarNumber(input);

  // Bharat Series check: 2 digits - BH - 4 digits - 1 or 2 letters
  if (/^\d{2}-BH-\d{4}-[A-Z]{1,2}$/.test(formatted)) {
    return {
      isValid: true,
      formatted,
      type: 'BH_SERIES',
      badge: 'Bharat Series (All-India)'
    };
  }

  // Standard State check: 2 letters - 1 or 2 digits - 1 or 2 letters - 4 digits (e.g. AP-31-EA-1234 or AP-31-E-1234)
  if (/^[A-Z]{2}-\d{1,2}-[A-Z]{1,2}-\d{4}$/.test(formatted)) {
    const parts = formatted.split('-');
    const stateCode = parts[0];
    const rtoCode = parts[1].padStart(2, '0');
    const stateObj = INDIAN_STATES_RTO[stateCode];
    const rtoName = stateObj?.rtos?.[rtoCode] || stateObj?.rtos?.[parts[1]] || '';

    return {
      isValid: true,
      formatted,
      type: 'STATE_SERIES',
      stateName: stateObj?.name || stateCode,
      rtoName,
      badge: rtoName ? `${rtoName} (${stateCode})` : (stateObj?.name || stateCode)
    };
  }

  // Permissive check for 1-3 digits while still typing or vintage registrations
  if (/^[A-Z]{2}-\d{1,2}-[A-Z]{1,2}-\d{1,4}$/.test(formatted)) {
    return {
      isValid: true,
      formatted,
      type: 'STATE_PARTIAL',
      badge: 'Standard Indian Format'
    };
  }

  return {
    isValid: false,
    formatted,
    message: 'Please enter a valid format: AP-31-EA-1234 (xx-xx-xx-xxxx), AP-31-E-1234 (xx-xx-x-xxxx), or 22-BH-1234-AA (BH Series).'
  };
};

/**
 * Returns RTO District & State Metadata for display
 */
export const getCarNumberMetadata = (input) => {
  if (!input) return null;
  const formatted = formatIndianCarNumber(input);

  if (/^\d{2}-BH/.test(formatted)) {
    const parts = formatted.split('-');
    const year = parts[0] ? `20${parts[0]}` : '';
    return {
      type: 'BH',
      isBh: true,
      stateName: 'Bharat Series (Pan-India)',
      rtoName: year ? `Reg. Year ${year}` : 'Defense / Multi-State PSU',
      displayName: year ? `Bharat Series • Reg. ${year}` : 'Bharat Series (BH)',
      seriesType: 'BH Series',
      badge: '🇮🇳 Bharat Series (BH)'
    };
  }

  const parts = formatted.split('-');
  if (parts.length >= 2 && parts[0].length === 2) {
    const stateCode = parts[0];
    const rtoCode = parts[1].padStart(2, '0');
    const stateObj = INDIAN_STATES_RTO[stateCode];
    if (stateObj) {
      const rtoName = stateObj.rtos?.[rtoCode] || stateObj.rtos?.[parts[1]] || '';
      const display = rtoName ? `${rtoName}, ${stateObj.name}` : stateObj.name;
      return {
        type: 'STATE',
        isBh: false,
        stateCode,
        stateName: stateObj.name,
        rtoName: rtoName || 'RTO Hub',
        displayName: display,
        seriesType: `${stateCode} Series`,
        badge: display
      };
    }
  }

  return null;
};

/**
 * Match a raw or formatted car number against user's saved garage cars
 */
export const findSavedCarByNumber = (inputNumber, savedCars = []) => {
  if (!inputNumber || !Array.isArray(savedCars) || savedCars.length === 0) return null;
  const cleanInput = String(inputNumber).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (!cleanInput || cleanInput.length < 4) return null;

  return savedCars.find(car => {
    if (!car || !car.carNumber) return false;
    const cleanCarNum = String(car.carNumber).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return cleanCarNum === cleanInput;
  }) || null;
};
