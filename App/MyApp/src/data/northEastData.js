/**
 * North Eastern States Data
 * States, Districts, and Villages for dropdown selection
 */

export const NORTH_EAST_DATA = {
  'Assam': {
    districts: {
      'Kamrup': ['Guwahati', 'Rangia', 'Hajo', 'Chaygaon', 'Boko'],
      'Dibrugarh': ['Dibrugarh Town', 'Naharkatia', 'Duliajan', 'Tingkhong', 'Moran'],
      'Jorhat': ['Jorhat Town', 'Titabar', 'Mariani', 'Teok', 'Majuli'],
      'Nagaon': ['Nagaon Town', 'Hojai', 'Lumding', 'Dhing', 'Raha'],
      'Sonitpur': ['Tezpur', 'Biswanath Chariali', 'Dhekiajuli', 'Rangapara', 'Gohpur'],
    },
  },
  'Arunachal Pradesh': {
    districts: {
      'Papum Pare': ['Itanagar', 'Naharlagun', 'Nirjuli', 'Banderdewa', 'Balijan'],
      'Changlang': ['Changlang', 'Miao', 'Jairampur', 'Nampong', 'Kharsang'],
      'East Kameng': ['Seppa', 'Chayang Tajo', 'Pipu', 'Bameng', 'Pakke Kessang'],
      'Lower Subansiri': ['Ziro', 'Hapoli', 'Yachuli', 'Tamen', 'Dutta'],
      'Tawang': ['Tawang', 'Lumla', 'Jang', 'Mukto', 'Thingbu'],
    },
  },
  'Manipur': {
    districts: {
      'Imphal East': ['Porompat', 'Jiribam', 'Lamlai', 'Sawombung', 'Andro'],
      'Imphal West': ['Imphal', 'Lamphelpat', 'Wangoi', 'Sekmai', 'Iroisemba'],
      'Thoubal': ['Thoubal', 'Lilong', 'Yairipok', 'Wangjing', 'Kakching'],
      'Bishnupur': ['Bishnupur', 'Moirang', 'Nambol', 'Kumbi', 'Ningthoukhong'],
      'Churachandpur': ['Churachandpur', 'Singngat', 'Tuibong', 'Henglep', 'Samulamlan'],
    },
  },
  'Meghalaya': {
    districts: {
      'East Khasi Hills': ['Shillong', 'Mawlai', 'Pynursla', 'Mawkynrew', 'Mylliem'],
      'West Garo Hills': ['Tura', 'Dadenggre', 'Tikrikilla', 'Dalu', 'Selsella'],
      'Jaintia Hills': ['Jowai', 'Amlarem', 'Khliehriat', 'Nartiang', 'Thadlaskein'],
      'Ri Bhoi': ['Nongpoh', 'Umsning', 'Byrnihat', 'Patharkhmah', 'Jirang'],
      'South West Khasi Hills': ['Mawkyrwat', 'Ranikor', 'Maheshkhola', 'Riangdo', 'Nongstoin'],
    },
  },
  'Mizoram': {
    districts: {
      'Aizawl': ['Aizawl', 'Darlawn', 'Thingsulthliah', 'Sairang', 'Phullen'],
      'Lunglei': ['Lunglei', 'Hnahthial', 'Bunghmun', 'Tlabung', 'Lungsen'],
      'Champhai': ['Champhai', 'Khawzawl', 'Ngopa', 'Zokhawthar', 'Vengthlang'],
      'Kolasib': ['Kolasib', 'Vairengte', 'Bilkhawthlir', 'Kawnpui', 'Thingdawl'],
      'Serchhip': ['Serchhip', 'North Vanlaiphai', 'East Lungdar', 'Chhiahtlang', 'Thenzawl'],
    },
  },
  'Nagaland': {
    districts: {
      'Kohima': ['Kohima', 'Jakhama', 'Jotsoma', 'Khonoma', 'Viswema'],
      'Dimapur': ['Dimapur', 'Chumukedima', 'Medziphema', 'Niuland', 'Dhansiripar'],
      'Mokokchung': ['Mokokchung', 'Ungma', 'Longkhim', 'Tuli', 'Mangkolemba'],
      'Tuensang': ['Tuensang', 'Noklak', 'Shamator', 'Chare', 'Sangsangnyu'],
      'Wokha': ['Wokha', 'Bhandari', 'Chukitong', 'Sanis', 'Ralan'],
    },
  },
  'Sikkim': {
    districts: {
      'East Sikkim': ['Gangtok', 'Rongli', 'Pakyong', 'Ranipool', 'Singtam'],
      'West Sikkim': ['Geyzing', 'Pelling', 'Yuksom', 'Dentam', 'Soreng'],
      'North Sikkim': ['Mangan', 'Chungthang', 'Lachung', 'Lachen', 'Kabi'],
      'South Sikkim': ['Namchi', 'Ravangla', 'Jorethang', 'Melli', 'Temi'],
    },
  },
  'Tripura': {
    districts: {
      'West Tripura': ['Agartala', 'Mohanpur', 'Hezamara', 'Jirania', 'Mandwai'],
      'Sepahijala': ['Bishramganj', 'Sonamura', 'Melaghar', 'Kathalia', 'Boxanagar'],
      'Gomati': ['Udaipur', 'Amarpur', 'Karbook', 'Matabari', 'Kakraban'],
      'Dhalai': ['Ambassa', 'Kamalpur', 'Salema', 'Chawmanu', 'Dumburnagar'],
      'North Tripura': ['Dharmanagar', 'Kanchanpur', 'Panisagar', 'Pecharthal', 'Jubarajnagar'],
    },
  },
};

// Get list of states
export const getStates = () => {
  return Object.keys(NORTH_EAST_DATA).sort();
};

// Get districts for a state
export const getDistricts = (state) => {
  if (!state || !NORTH_EAST_DATA[state]) return [];
  return Object.keys(NORTH_EAST_DATA[state].districts).sort();
};

// Get villages for a district
export const getVillages = (state, district) => {
  if (!state || !district || !NORTH_EAST_DATA[state] || !NORTH_EAST_DATA[state].districts[district]) {
    return [];
  }
  return NORTH_EAST_DATA[state].districts[district].sort();
};
