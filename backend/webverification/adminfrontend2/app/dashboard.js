import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Image,
  TextInput,
  Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "../services/apiService";

// Import local logo asset
const logoImage = require("../assets/logo.png");

export default function DashboardScreen() {
  const router = useRouter();
  const [retailerStats, setRetailerStats] = useState(null);
  const [vendorStats, setVendorStats] = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [selectedRegionTab, setSelectedRegionTab] = useState("state"); // 'state', 'district', 'town'
  const [regionSearch, setRegionSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState({
    state: "All India",
    district: "All Districts",
    town: "All Towns",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRange, setSelectedRange] = useState("year");
  const [viewDate, setViewDate] = useState(new Date());
  const [rangeStart, setRangeStart] = useState(
    new Date(new Date().getFullYear(), 0, 1),
  );
  const [rangeEnd, setRangeEnd] = useState(
    new Date(new Date().getFullYear(), 11, 31),
  );
  const today = new Date().getDate();

  const [showBarTooltip, setShowBarTooltip] = useState(false);
  const [tooltipType, setTooltipType] = useState("retailer");
  const [tooltipDetails, setTooltipDetails] = useState({
    approved: [],
    pending: [],
    rejected: [],
    new: [],
  });
  const [loadingTooltip, setLoadingTooltip] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [dynamicLocationData, setDynamicLocationData] = useState({});

  const STATE_DISTRICT_TOWN_DATA = {
    Karnataka: {
      "Bengaluru Urban": [
        "Majestic",
        "Indiranagar",
        "Jayanagar",
        "Koramangala",
        "HSR Layout",
        "Malleshwaram",
        "Whitefield",
        "Marathahalli",
        "Electronic City",
        "Yelahanka",
        "Rajajinagar",
        "Banashankari",
        "BTM Layout",
        "Hebbal",
        "Kengeri",
      ],
      "Bengaluru Rural": [
        "Devanahalli",
        "Doddaballapura",
        "Hoskote",
        "Nelamangala",
      ],
      Mysuru: [
        "Mysuru Town",
        "Kuvempunagar",
        "Sriramapura",
        "Saraswathipuram",
        "Gokulam",
        "V.V. Mohalla",
        "Vijayanagar",
        "Jayalakshmipuram",
        "J.P. Nagar",
        "Nanjangud",
        "Hunsur",
        "T. Narasipura",
        "Periyapatna",
        "K.R. Nagar",
      ],
      "Dakshina Kannada": [
        "Mangaluru",
        "Surathkal",
        "Ullal",
        "Bantwal",
        "Puttur",
        "Belthangady",
        "Sullia",
      ],
      Udupi: ["Udupi Town", "Manipal", "Malpe", "Kundapura", "Karkala", "Kaup"],
      Dharwad: ["Hubballi", "Dharwad Town", "Navalgund", "Kalghatgi"],
      Belagavi: [
        "Belagavi Town",
        "Gokak",
        "Athani",
        "Chikodi",
        "Bailhongal",
        "Saundatti",
        "Ramdurg",
        "Hukkeri",
      ],
      Kalaburagi: [
        "Kalaburagi Town",
        "Afzalpur",
        "Aland",
        "Chincholi",
        "Sedam",
      ],
      Ballari: ["Ballari Town", "Kampli", "Siruguppa"],
      Tumakuru: ["Tumakuru Town", "Tiptur", "Kunigal", "Madhugiri", "Sira"],
      Davanagere: ["Davanagere Town", "Harihara", "Honnali", "Channagiri"],
      Shivamogga: [
        "Shivamogga Town",
        "Bhadravati",
        "Sagar",
        "Shikaripura",
        "Soraba",
        "Thirthahalli",
      ],
      Hassan: [
        "Hassan Town",
        "Arsikere",
        "Channarayapatna",
        "Hole Narsipur",
        "Sakleshpur",
      ],
      Chikkamagaluru: [
        "Chikkamagaluru Town",
        "Kadur",
        "Tarikere",
        "Mudigere",
        "Koppa",
      ],
      Kodagu: ["Madikeri", "Virajpet", "Somwarpet", "Kushalnanagar"],
      Mandya: [
        "Mandya Town",
        "Maddur",
        "Malavalli",
        "Pandavapura",
        "Srirangapatna",
        "Nagamangala",
        "K.R. Pet",
      ],
      Ramanagara: ["Ramanagara Town", "Channapatna", "Magadi", "Kanakapura"],
      Chamarajanagar: [
        "Chamarajanagar Town",
        "Kollegal",
        "Gundlupet",
        "Yalandur",
      ],
      "Uttara Kannada": [
        "Karwar",
        "Sirsi",
        "Kumta",
        "Bhatkal",
        "Ankola",
        "Haliyal",
        "Yellapur",
      ],
      Haveri: ["Haveri Town", "Ranebennur", "Byadgi", "Hanagal"],
      Gadag: ["Gadag-Betageri", "Mundargi", "Ron", "Nargund"],
      Bagalkot: ["Bagalkot Town", "Badami", "Jamkhandi", "Mudhol", "Ilkal"],
      Vijayapura: [
        "Vijayapura Town",
        "Indi",
        "Muddebihal",
        "Sindagi",
        "Basavana Bagewadi",
      ],
      Bidar: ["Bidar Town", "Basavakalyan", "Homnabad", "Bhalki", "Aurad"],
      Yadgir: ["Yadgir Town", "Shahapur", "Shorapur"],
      Kolar: [
        "Kolar Town",
        "Kolar Gold Fields (KGF)",
        "Bangarapet",
        "Mulbagal",
        "Srinivaspur",
        "Malur",
      ],
      Chikkaballapur: [
        "Chikkaballapur Town",
        "Chintamani",
        "Sidlaghatta",
        "Gauribidanur",
        "Bagepalli",
      ],
      Chitradurga: [
        "Chitradurga Town",
        "Hiriyur",
        "Challakere",
        "Hosadurga",
        "Holalkere",
        "Molakalmuru",
      ],
      Koppal: ["Koppal Town", "Gangavathi", "Kushtagi", "Yelbarga"],
      Raichur: [
        "Raichur Town",
        "Manvi",
        "Sindhanur",
        "Lingasugur",
        "Devadurga",
      ],
    },
    Maharashtra: {
      Mumbai: ["Colaba", "Andheri", "Bandra", "Borivali", "Dadar", "Kurla"],
      Pune: [
        "Pune City",
        "Pimpri-Chinchwad",
        "Hinjewadi",
        "Kothrud",
        "Hadapsar",
      ],
      Nagpur: ["Nagpur City", "Kamptee", "Hingna"],
      Nashik: ["Nashik City", "Deolali", "Igatpuri"],
      Aurangabad: ["Aurangabad City", "Paithan", "Sillod"],
      Thane: ["Thane City", "Kalyan", "Dombivli", "Mira-Bhayandar"],
    },
    Delhi: {
      "New Delhi": ["Connaught Place", "Chanakyapuri", "Karol Bagh"],
      "Central Delhi": ["Daryaganj", "Paharganj"],
      "South Delhi": ["Saket", "Hauz Khas", "Mehrauli", "RK Puram"],
      "West Delhi": ["Rajouri Garden", "Punjabi Bagh", "Janakpuri"],
      "North Delhi": ["Civil Lines", "Model Town"],
    },
    Gujarat: {
      Ahmedabad: ["Ahmedabad City", "Maninagar", "Navrangpura"],
      Surat: ["Surat City", "Varachha", "Adajan"],
      Vadodara: ["Vadodara City", "Sayajigunj", "Alkapuri"],
      Rajkot: ["Rajkot City", "Morbi", "Gondal"],
    },
    "Tamil Nadu": {
      Chennai: ["Chennai City", "Adyar", "Anna Nagar", "T-Nagar"],
      Coimbatore: ["Coimbatore City", "Pollachi", "Tiruppur"],
      Madurai: ["Madurai City", "Melur", "Usilampatti"],
    },
    Telangana: {
      Hyderabad: [
        "Hyderabad City",
        "Secunderabad",
        "Gachibowli",
        "Banjara Hills",
      ],
      Warangal: ["Warangal City", "Hanamkonda", "Kazipet"],
      Nizamabad: ["Nizamabad City", "Bodhan", "Armoor"],
    },
    Kerala: {
      Ernakulam: ["Kochi", "Aluva", "Angamaly"],
      Thiruvananthapuram: ["Trivandrum City", "Neyyattinkara", "Attingal"],
      Kozhikode: ["Calicut City", "Vatakara", "Quilandy"],
    },
    "Uttar Pradesh": {
      Lucknow: ["Lucknow City", "Gomti Nagar", "Aliganj"],
      Kanpur: ["Kanpur City", "Jajmau", "Kalyanpur"],
      Agra: ["Agra City", "Tajganj", "Sikandra"],
      Varanasi: ["Varanasi City", "Sarnath", "Ramnagar"],
      Noida: ["Sector 18", "Sector 62", "Greater Noida"],
    },
    "West Bengal": {
      Kolkata: ["Kolkata City", "Salt Lake", "New Town", "Behala"],
      Howrah: ["Howrah City", "Bally", "Uluberia"],
      Darjeeling: ["Darjeeling City", "Siliguri", "Kurseong"],
    },
    Rajasthan: {
      Jaipur: ["Jaipur City", "Amer", "Sanganer"],
      Jodhpur: ["Jodhpur City", "Luni", "Bilara"],
      Udaipur: ["Udaipur City", "Vallabhnagar", "Salumbar"],
    },
    Punjab: {
      Amritsar: ["Amritsar City", "Ajnala", "Baba Bakala"],
      Ludhiana: ["Ludhiana City", "Khanna", "Jagraon"],
      Chandigarh: ["Sector 17", "Sector 35", "Manimajra"],
    },
    Haryana: {
      Gurugram: ["DLF Phase 1", "Cyber Hub", "Sohna Road"],
      Faridabad: ["Nit", "Old Faridabad", "Ballabgarh"],
      Panipat: ["Panipat City", "Samalkha", "Israna"],
    },
    "Madhya Pradesh": {
      Indore: ["Indore City", "Mhow", "Depalpur"],
      Bhopal: ["Bhopal City", "Bairagarh", "Govindpura"],
      Gwalior: ["Gwalior City", "Dabra", "Bhitarwar"],
    },
    "Andhra Pradesh": {
      Visakhapatnam: ["Vizag City", "Gajuwaka", "Anakapalle"],
      Vijayawada: ["Vijayawada City", "Guntupalli", "Kankipadu"],
      Guntur: ["Guntur City", "Tenali", "Narasaraopet"],
    },
    Assam: {
      "Kamrup Metropolitan": ["Guwahati", "Dispur", "Maligaon"],
      Dibrugarh: ["Dibrugarh City", "Chabua", "Naharkatia"],
    },
    Bihar: {
      Patna: ["Patna City", "Danapur", "Phulwari Sharif"],
      Gaya: ["Gaya City", "Bodh Gaya", "Sherghati"],
    },
    Goa: {
      "North Goa": ["Panaji", "Mapusa", "Calangute"],
      "South Goa": ["Margao", "Vasco da Gama", "Ponda"],
    },
    "Himachal Pradesh": {
      Shimla: ["Shimla City", "Rampur", "Rohru"],
      Kullu: ["Kullu Town", "Manali", "Anni"],
    },
    "Jammu and Kashmir": {
      Srinagar: ["Srinagar City", "Ganderbal", "Badgam"],
      Jammu: ["Jammu City", "Akhnoor", "R.S. Pura"],
    },
    Jharkhand: {
      Ranchi: ["Ranchi City", "Hatia", "Kanke"],
      Jamshedpur: ["Tatanagar", "Mango", "Jugsalai"],
    },
    Odisha: {
      Khordha: ["Bhubaneswar", "Khurda Town", "Jatni"],
      Cuttack: ["Cuttack City", "Choudwar", "Athagarh"],
    },
    Uttarakhand: {
      Dehradun: ["Dehradun City", "Mussoorie", "Rishikesh"],
      Nainital: ["Nainital Town", "Haldwani", "Ramnagar"],
    },
    Chhattisgarh: {
      Raipur: ["Raipur City", "Arang", "Abhanpur"],
      Bilaspur: ["Bilaspur City", "Kota", "Takhatpur"],
    },
    Manipur: { "Main Districts": ["Imphal East", "Imphal West"] },
    Meghalaya: { "Main Districts": ["Shillong", "Tura"] },
    Mizoram: { "Main Districts": ["Aizawl", "Lunglei"] },
    Nagaland: { "Main Districts": ["Kohima", "Dimapur"] },
    Sikkim: { "Main Districts": ["Gangtok", "Namchi"] },
    Tripura: { "Main Districts": ["Agartala", "Udaipur"] },
    "Arunachal Pradesh": { "Main Districts": ["Itanagar", "Tawang"] },
    "Andaman and Nicobar Islands": { "Main Districts": ["Port Blair"] },
    Chandigarh: { "Main Districts": ["Chandigarh City"] },
    "Dadra and Nagar Haveli and Daman and Diu": {
      "Main Districts": ["Daman", "Diu", "Silvassa"],
    },
    Ladakh: { "Main Districts": ["Leh", "Kargil"] },
    Lakshadweep: { "Main Districts": ["Kavaratti"] },
    Puducherry: {
      "Main Districts": ["Puducherry Town", "Karaikal", "Mahe", "Yanam"],
    },
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await apiService.getLocations();
      setDynamicLocationData(data);
    } catch (err) {
      console.error("Error fetching dynamic locations:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [selectedRange, rangeStart, rangeEnd, selectedRegion]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const fetchStats = async () => {
    try {
      // Only show full screen loader if we don't have data yet
      if (!retailerStats) setLoading(true);
      setError(null);

      const params = {
        period: selectedRange === "today" ? "day" : selectedRange,
        state:
          selectedRegion.state !== "All India"
            ? selectedRegion.state
            : undefined,
        district:
          selectedRegion.district !== "All Districts"
            ? selectedRegion.district
            : undefined,
        town:
          selectedRegion.town !== "All Towns" ? selectedRegion.town : undefined,
      };

      if (selectedRange === "custom" && rangeStart && rangeEnd) {
        const formatDateLocal = (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };
        params.startDate = formatDateLocal(rangeStart);

        // FIX: If single day selected, extend end date by 1 day to cover full 24h in SQL 'BETWEEN'
        if (rangeStart.getTime() === rangeEnd.getTime()) {
          const nextDay = new Date(rangeEnd);
          nextDay.setDate(nextDay.getDate() + 1);
          params.endDate = formatDateLocal(nextDay);
        } else {
          params.endDate = formatDateLocal(rangeEnd);
        }
      }

      const stats = await apiService.getDashboardStats(params);

      // Map backend response (Approved, Pending, Rejected, New) to frontend state
      // Robust mapping to handle both capitalized (backend default) and potential lowercase keys
      setRetailerStats({
        approved: stats.retailers.Approved || stats.retailers.approved || 0,
        pending: stats.retailers.Pending || stats.retailers.pending || 0,
        rejected: stats.retailers.Rejected || stats.retailers.rejected || 0,
        new: stats.retailers.New || stats.retailers.new || 0,
        total:
          (stats.retailers.Approved || stats.retailers.approved || 0) +
          (stats.retailers.Pending || stats.retailers.pending || 0) +
          (stats.retailers.Rejected || stats.retailers.rejected || 0) +
          (stats.retailers.New || stats.retailers.new || 0),
      });

      setVendorStats({
        approved: stats.vendors.Approved || stats.vendors.approved || 0,
        pending: stats.vendors.Pending || stats.vendors.pending || 0,
        rejected: stats.vendors.Rejected || stats.vendors.rejected || 0,
        new: stats.vendors.New || stats.vendors.new || 0,
        total:
          (stats.vendors.Approved || stats.vendors.approved || 0) +
          (stats.vendors.Pending || stats.vendors.pending || 0) +
          (stats.vendors.Rejected || stats.vendors.rejected || 0) +
          (stats.vendors.New || stats.vendors.new || 0),
      });

      if (stats.products) {
        setProductStats({
          approved: stats.products.Approved || 0,
          pending: stats.products.Pending || 0,
          rejected: stats.products.Rejected || 0,
          total: stats.products.Total || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };


  const handleRangeClick = (range) => {
    setSelectedRange(range);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (range === "today") {
      setRangeStart(new Date(now));
      setRangeEnd(new Date(now));
    } else if (range === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      setRangeStart(start);
      setRangeEnd(now);
    } else if (range === "month") {
      const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
      setRangeStart(start);
      setRangeEnd(end);
    } else if (range === "year") {
      const start = new Date(viewDate.getFullYear(), 0, 1);
      const end = new Date(viewDate.getFullYear(), 11, 31);
      setRangeStart(start);
      setRangeEnd(end);
    }
  };

  const handleDatePress = (date) => {
    const clickedDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      date,
    );
    clickedDate.setHours(0, 0, 0, 0);

    if (
      !rangeStart ||
      (rangeStart && rangeEnd && rangeStart.getTime() !== rangeEnd.getTime())
    ) {
      setRangeStart(clickedDate);
      setRangeEnd(clickedDate);

      // Check if clicked date is today
      const isToday =
        clickedDate.getDate() === new Date().getDate() &&
        clickedDate.getMonth() === new Date().getMonth() &&
        clickedDate.getFullYear() === new Date().getFullYear();

      setSelectedRange(isToday ? "today" : "custom");
    } else {
      const start =
        rangeStart.getTime() < clickedDate.getTime() ? rangeStart : clickedDate;
      const end =
        rangeStart.getTime() < clickedDate.getTime() ? clickedDate : rangeStart;
      setRangeStart(new Date(start));
      setRangeEnd(new Date(end));
      setSelectedRange("custom");
    }
  };

  const fetchTooltipDetails = async (type) => {
    setLoadingTooltip(true);
    try {
      const baseParams = {
        type,
        period: selectedRange === "today" ? "day" : selectedRange,
        state:
          selectedRegion.state !== "All India"
            ? selectedRegion.state
            : undefined,
        district:
          selectedRegion.district !== "All Districts"
            ? selectedRegion.district
            : undefined,
        town:
          selectedRegion.town !== "All Towns" ? selectedRegion.town : undefined,
      };

      if (selectedRange === "custom" && rangeStart && rangeEnd) {
        const formatDateLocal = (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };
        baseParams.startDate = formatDateLocal(rangeStart);

        // FIX: If single day selected, extend end date by 1 day
        if (rangeStart.getTime() === rangeEnd.getTime()) {
          const nextDay = new Date(rangeEnd);
          nextDay.setDate(nextDay.getDate() + 1);
          baseParams.endDate = formatDateLocal(nextDay);
        } else {
          baseParams.endDate = formatDateLocal(rangeEnd);
        }
      }

      const approved = await apiService.getDashboardDetails({
        ...baseParams,
        status: "Approved",
      });
      const pending = await apiService.getDashboardDetails({
        ...baseParams,
        status: "Pending",
      });
      const rejected = await apiService.getDashboardDetails({
        ...baseParams,
        status: "Rejected",
      });
      const newData = await apiService.getDashboardDetails({
        ...baseParams,
        status: "New",
      });

      setTooltipDetails({
        approved: approved || [],
        pending: pending || [],
        rejected: rejected || [],
        new: newData || [],
      });
    } catch (error) {
      console.error("Error fetching tooltip details:", error);
    } finally {
      setLoadingTooltip(false);
    }
  };

  const StackedBar = () => {
    const rStats = retailerStats || {
      approved: 0,
      pending: 0,
      rejected: 0,
      new: 0,
      total: 0,
    };
    const vStats = vendorStats || {
      approved: 0,
      pending: 0,
      rejected: 0,
      new: 0,
      total: 0,
    };

    const totalMax = Math.max(rStats.total, vStats.total, 28);
    const maxValue = Math.ceil(totalMax / 7) * 7;
    const gridLines = [
      0,
      Math.floor(maxValue * 0.25),
      Math.floor(maxValue * 0.5),
      Math.floor(maxValue * 0.75),
      maxValue,
    ];

    const getSegmentHeight = (val) => (val / maxValue) * 200;

    const Bar = ({ approved, pending, rejected, newData, type }) => {
      const total = approved + pending + rejected + newData;
      const totalHeight = getSegmentHeight(total);

      return (
        <TouchableOpacity
          style={styles.barGroup}
          onPress={async () => {
            setTooltipType(type);
            setShowBarTooltip(true);
            await fetchTooltipDetails(type);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.barContainer}>
            <View
              style={{
                height: totalHeight,
                width: "100%",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {/* Stacked Segments - Bottom up: Approved (Green), New (Blue), Pending (Yellow), Rejected (Red) */}
              <View
                style={[
                  styles.barSegment,
                  {
                    height: getSegmentHeight(rejected),
                    backgroundColor: "#B91C1C",
                    zIndex: 4,
                  },
                ]}
              />
              <View
                style={[
                  styles.barSegment,
                  {
                    height: getSegmentHeight(pending),
                    backgroundColor: "#A16207",
                    zIndex: 3,
                  },
                ]}
              />
              <View
                style={[
                  styles.barSegment,
                  {
                    height: getSegmentHeight(newData),
                    backgroundColor: "#1D4ED8",
                    zIndex: 2,
                  },
                ]}
              />
              <View
                style={[
                  styles.barSegment,
                  {
                    height: getSegmentHeight(approved),
                    backgroundColor: "#15803D",
                    zIndex: 1,
                  },
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartMainTitle}>
          Retailer & Vendor Registration
        </Text>
        <View style={styles.chartBody}>
          {/* Y-Axis Labels */}
          <View style={styles.yAxis}>
            {gridLines.reverse().map((val) => (
              <Text key={val} style={styles.yAxisText}>
                {val}
              </Text>
            ))}
          </View>

          <View style={styles.chartArea}>
            {/* Grid Lines */}
            <View style={styles.gridLinesContainer}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>

            <View style={styles.barsRow}>
              <Bar
                approved={rStats.approved}
                pending={rStats.pending}
                rejected={rStats.rejected}
                newData={rStats.new}
                type="retailer"
              />

              <Bar
                approved={vStats.approved}
                pending={vStats.pending}
                rejected={vStats.rejected}
                newData={vStats.new}
                type="vendor"
              />
            </View>
          </View>
        </View>

        {/* X-Axis Labels (Outside Chart Body) */}
        <View style={styles.xAxisRow}>
          <View style={styles.yAxisSpacer} />
          <View style={styles.xAxisLabelsContainer}>
            <Text style={styles.xAxisLabel}>Retailers</Text>
            <Text style={styles.xAxisLabel}>Vendors</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#15803D" }]} />
            <Text style={styles.legendLabel}>Approved</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#1D4ED8" }]} />
            <Text style={styles.legendLabel}>New</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#A16207" }]} />
            <Text style={styles.legendLabel}>Pending</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#B91C1C" }]} />
            <Text style={styles.legendLabel}>Rejected</Text>
          </View>
        </View>
      </View>
    );
  };

  const SummaryCard = ({ title, stats }) => (
    <View style={styles.sumCard}>
      <Text style={styles.sumCardTitle}>{title}</Text>
      <View style={styles.sumCardRow}>
        <View style={styles.sumItem}>
          <Text style={styles.sumLabel}>New</Text>
          <Text style={[styles.sumValue, { color: "#1D4ED8" }]}>
            {stats?.new || 0}
          </Text>
        </View>
        <View style={styles.sumItem}>
          <Text style={styles.sumLabel}>Approved</Text>
          <Text style={[styles.sumValue, { color: "#15803D" }]}>
            {stats?.approved || 0}
          </Text>
        </View>
        <View style={styles.sumItem}>
          <Text style={styles.sumLabel}>Rejected</Text>
          <Text style={[styles.sumValue, { color: "#B91C1C" }]}>
            {stats?.rejected || 0}
          </Text>
        </View>
        <View style={styles.sumItem}>
          <Text style={styles.sumLabel}>Pending</Text>
          <Text style={[styles.sumValue, { color: "#A16207" }]}>
            {stats?.pending || 0}
          </Text>
        </View>
      </View>
    </View>
  );

  const handleExport = async (format) => {
    console.log(`Export initiated for format: ${format}`);
    try {
      setShowExportDropdown(false);

      // Build export parameters matching current dashboard filters
      const params = {
        format,
        period: selectedRange === "today" ? "day" : selectedRange,
        state:
          selectedRegion.state !== "All India"
            ? selectedRegion.state
            : undefined,
        district:
          selectedRegion.district !== "All Districts"
            ? selectedRegion.district
            : undefined,
        town:
          selectedRegion.town !== "All Towns" ? selectedRegion.town : undefined,
      };

      if (selectedRange === "custom" && rangeStart && rangeEnd) {
        const formatDateLocal = (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };
        params.startDate = formatDateLocal(rangeStart);

        // If single day selected, extend end date by 1 day
        if (rangeStart.getTime() === rangeEnd.getTime()) {
          const nextDay = new Date(rangeEnd);
          nextDay.setDate(nextDay.getDate() + 1);
          params.endDate = formatDateLocal(nextDay);
        } else {
          params.endDate = formatDateLocal(rangeEnd);
        }
      }

      await apiService.exportDashboardData(params);

      // Optional: Show success feedback
      console.log(`${format.toUpperCase()} export completed successfully`);
    } catch (error) {
      console.error("Export error:", error);
      alert(
        error.message ||
        `Failed to export ${format.toUpperCase()}. Please try again.`,
      );
    }
  };

  if (loading && !retailerStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header with Nav, Back, Centered Logo, and Profile */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.replace("/onboarding-type")}
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <TouchableOpacity
            onPress={() => router.replace("/onboarding-type")}
            activeOpacity={0.7}
          >
            <Image
              source={logoImage}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Profile icon removed for cleaner look */}
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.mainContent}>
          {/* Dashboard Title & Filter */}
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.dashboardTitle}>Dashboard</Text>
              <Text style={styles.analyticsTitle}>Analytics</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={styles.monthDropdown}
                onPress={() => setShowRegionPicker(true)}
              >
                <Text style={styles.monthText}>
                  {selectedRegion.town !== "All Towns"
                    ? selectedRegion.town
                    : selectedRegion.district !== "All Districts"
                      ? selectedRegion.district
                      : selectedRegion.state}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.monthDropdown}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.monthText}>
                  {selectedRange === "custom" && rangeStart && rangeEnd
                    ? `${rangeStart.getDate()} ${monthNames[rangeStart.getMonth()]} - ${rangeEnd.getDate()} ${monthNames[rangeEnd.getMonth()]}`
                    : "Calendar"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
              <View style={{ position: "relative" }}>
                <TouchableOpacity
                  style={[styles.monthDropdown, { backgroundColor: "#A855F7" }]}
                  onPress={() => setShowExportDropdown(!showExportDropdown)}
                >
                  <MaterialCommunityIcons
                    name="export-variant"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.monthText}>Export</Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                {/* Export Dropdown */}
                {showExportDropdown && (
                  <>
                    <TouchableOpacity
                      style={styles.exportDropdownBackdrop}
                      activeOpacity={1}
                      onPress={() => setShowExportDropdown(false)}
                    />

                    <View style={styles.exportDropdown}>
                      <Pressable
                        style={({ pressed, hovered }) => [
                          styles.exportOption,
                          (pressed || hovered) && styles.exportOptionHovered,
                        ]}
                        onPress={() => {
                          console.log("PDF option pressed via Pressable");
                          handleExport("pdf");
                        }}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.exportOptionText}>
                          Export as PDF
                        </Text>
                      </Pressable>
                      <View style={styles.exportDivider} />
                      <Pressable
                        style={({ pressed, hovered }) => [
                          styles.exportOption,
                          (pressed || hovered) && styles.exportOptionHovered,
                        ]}
                        onPress={() => {
                          console.log("Excel option pressed via Pressable");
                          handleExport("excel");
                        }}
                      >
                        <Ionicons
                          name="document-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.exportOptionText}>
                          Export as Excel
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Region Picker Modal */}
          {showRegionPicker && (
            <View style={styles.modalOverlayWrapper}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowRegionPicker(false)}
              />

              <View
                style={[
                  styles.datePickerContainer,
                  {
                    width: 440,
                    right: 130,
                    height: 500,
                    flexDirection: "column",
                  },
                ]}
              >
                {/* Top Tabs (Replacing Sidebar) */}
                <View style={styles.regionTabsHeader}>
                  {[
                    { id: "state", label: "States" },
                    { id: "district", label: "Districts" },
                    { id: "town", label: "Towns" },
                  ].map((tab) => (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.regionTabItem,
                        selectedRegionTab === tab.id &&
                        styles.regionTabItemActive,
                      ]}
                      onPress={() => {
                        setSelectedRegionTab(tab.id);
                        setRegionSearch("");
                      }}
                    >
                      <Text
                        style={
                          selectedRegionTab === tab.id
                            ? styles.regionTabActiveText
                            : styles.regionTabText
                        }
                      >
                        {tab.label}
                      </Text>
                      {selectedRegionTab === tab.id && (
                        <View style={styles.tabIndicator} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Content Area */}
                <View style={styles.calendarContainer}>
                  {/* Search Header */}
                  <View style={styles.regionSearchWrapper}>
                    <Ionicons name="search" size={18} color="#94A3B8" />
                    <TextInput
                      style={styles.regionSearchInput}
                      placeholder={`Search ${selectedRegionTab}...`}
                      placeholderTextColor="#64748B"
                      value={regionSearch}
                      onChangeText={setRegionSearch}
                    />
                  </View>

                  <ScrollView style={{ flex: 1, marginTop: 10 }}>
                    <View style={styles.regionListGrid}>
                      {(() => {
                        let items = [];
                        if (selectedRegionTab === "state") {
                          items = [
                            "All India",
                            ...Object.keys(dynamicLocationData).sort(),
                          ];
                        } else if (selectedRegionTab === "district") {
                          if (selectedRegion.state === "All India") {
                            // Collect all districts from all states
                            const allDistricts = new Set();
                            Object.values(dynamicLocationData).forEach(
                              (stateObj) => {
                                Object.keys(stateObj).forEach((d) =>
                                  allDistricts.add(d),
                                );
                              },
                            );
                            items = [
                              "All Districts",
                              ...Array.from(allDistricts).sort(),
                            ];
                          } else {
                            const stateData =
                              dynamicLocationData[selectedRegion.state] ||
                              {};
                            items = [
                              "All Districts",
                              ...Object.keys(stateData).sort(),
                            ];
                          }
                        } else {
                          if (selectedRegion.district === "All Districts") {
                            // Collect all towns from currently available districts
                            const allTowns = new Set();
                            if (selectedRegion.state === "All India") {
                              Object.values(dynamicLocationData).forEach(
                                (stateObj) => {
                                  Object.values(stateObj).forEach((townArr) => {
                                    townArr.forEach((t) => allTowns.add(t));
                                  });
                                },
                              );
                            } else {
                              const stateData =
                                dynamicLocationData[
                                selectedRegion.state
                                ] || {};
                              Object.values(stateData).forEach((townArr) => {
                                townArr.forEach((t) => allTowns.add(t));
                              });
                            }
                            items = [
                              "All Towns",
                              ...Array.from(allTowns).sort(),
                            ];
                          } else {
                            // Selected specific district (could be from any state if state is "All India")
                            let districtData = [];
                            if (selectedRegion.state === "All India") {
                              for (const stateObj of Object.values(
                                dynamicLocationData,
                              )) {
                                if (stateObj[selectedRegion.district]) {
                                  districtData =
                                    stateObj[selectedRegion.district];
                                  break;
                                }
                              }
                            } else {
                              districtData =
                                dynamicLocationData[
                                selectedRegion.state
                                ]?.[selectedRegion.district] || [];
                            }
                            items = ["All Towns", ...districtData.sort()];
                          }
                        }

                        return items
                          .filter((item) =>
                            item
                              .toLowerCase()
                              .includes(regionSearch.toLowerCase()),
                          )
                          .map((item) => {
                            const isSelected =
                              (selectedRegionTab === "state" &&
                                selectedRegion.state === item) ||
                              (selectedRegionTab === "district" &&
                                selectedRegion.district === item) ||
                              (selectedRegionTab === "town" &&
                                selectedRegion.town === item);

                            return (
                              <TouchableOpacity
                                key={item}
                                style={[
                                  styles.regionItemCell,
                                  isSelected && styles.regionItemCellActive,
                                ]}
                                onPress={() => {
                                  if (selectedRegionTab === "state") {
                                    setSelectedRegion({
                                      ...selectedRegion,
                                      state: item,
                                      district: "All Districts",
                                      town: "All Towns",
                                    });
                                    setSelectedRegionTab("district");
                                  }
                                  if (selectedRegionTab === "district") {
                                    setSelectedRegion({
                                      ...selectedRegion,
                                      district: item,
                                      town: "All Towns",
                                    });
                                    setSelectedRegionTab("town");
                                  }
                                  if (selectedRegionTab === "town") {
                                    setSelectedRegion({
                                      ...selectedRegion,
                                      town: item,
                                    });
                                  }
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.regionItemText,
                                      isSelected && styles.regionItemTextActive,
                                    ]}
                                  >
                                    {item}
                                  </Text>
                                </View>
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color="#A855F7"
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          });
                      })()}
                    </View>
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.regionApplyBtn}
                    onPress={() => setShowRegionPicker(false)}
                  >
                    <Text style={styles.regionApplyText}>Apply Selection</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Date Picker Modal */}
          {showDatePicker && (
            <View style={styles.modalOverlayWrapper}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              />

              <View style={styles.datePickerContainer}>
                {/* Left Sidebar */}
                <View style={styles.dateSidebar}>
                  {["today", "week", "month", "year"].map((range) => {
                    const isToday = range === "today";
                    const isCurrentDayMatch =
                      isToday &&
                      rangeStart &&
                      rangeEnd &&
                      rangeStart.getTime() === rangeEnd.getTime() &&
                      rangeStart.getDate() === new Date().getDate() &&
                      rangeStart.getMonth() === new Date().getMonth();

                    const isActive =
                      selectedRange === range || isCurrentDayMatch;

                    return (
                      <TouchableOpacity
                        key={range}
                        style={[
                          styles.sidebarItem,
                          isActive && styles.sidebarItemActive,
                        ]}
                        onPress={() => handleRangeClick(range)}
                      >
                        <Text
                          style={
                            isActive
                              ? styles.sidebarTextActive
                              : styles.sidebarText
                          }
                        >
                          {range.charAt(0).toUpperCase() + range.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Right Calendar Area */}
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={handlePrevMonth}>
                      <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.calendarMonthYear}>
                      {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </Text>
                    <TouchableOpacity onPress={handleNextMonth}>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.daysRow}>
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <Text key={day} style={styles.dayLabel}>
                        {day}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.datesGrid}>
                    {(() => {
                      const year = viewDate.getFullYear();
                      const month = viewDate.getMonth();
                      const firstDayOfMonth = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(
                        year,
                        month + 1,
                        0,
                      ).getDate();

                      const cells = [];
                      for (let i = 0; i < firstDayOfMonth; i++) {
                        cells.push(
                          <View key={`empty-${i}`} style={styles.dateCell} />,
                        );
                      }
                      for (let date = 1; date <= daysInMonth; date++) {
                        const currentCellDate = new Date(year, month, date);
                        currentCellDate.setHours(0, 0, 0, 0);
                        const currentCellTime = currentCellDate.getTime();

                        const startTime = rangeStart?.getTime() || 0;
                        const endTime = rangeEnd?.getTime() || 0;

                        const isSelected =
                          rangeStart &&
                          rangeEnd &&
                          currentCellTime >= startTime &&
                          currentCellTime <= endTime;
                        const isStart =
                          rangeStart && currentCellTime === startTime;
                        const isEnd = rangeEnd && currentCellTime === endTime;
                        const isToday =
                          date === today &&
                          month === new Date().getMonth() &&
                          year === new Date().getFullYear();

                        cells.push(
                          <TouchableOpacity
                            key={date}
                            onPress={() => handleDatePress(date)}
                            style={[
                              styles.dateCell,
                              isSelected && styles.dateCellSelected,
                              isSelected &&
                              startTime === endTime && {
                                borderRadius: 19,
                                backgroundColor: "#A855F7",
                              },
                              isSelected &&
                              startTime !== endTime &&
                              isStart && {
                                borderTopLeftRadius: 19,
                                borderBottomLeftRadius: 19,
                                backgroundColor: "rgba(168, 85, 247, 0.4)",
                              },
                              isSelected &&
                              startTime !== endTime &&
                              isEnd && {
                                borderTopRightRadius: 19,
                                borderBottomRightRadius: 19,
                                backgroundColor: "rgba(168, 85, 247, 0.4)",
                              },
                              isToday &&
                              !isSelected && {
                                borderColor: "#A855F7",
                                borderWidth: 1,
                                borderRadius: 19,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dateText,
                                isSelected && styles.dateTextSelected,
                                isSelected &&
                                rangeStart === rangeEnd && {
                                  color: "#FFFFFF",
                                },
                                isToday && !isSelected && { color: "#A855F7" },
                              ]}
                            >
                              {date}
                            </Text>
                          </TouchableOpacity>,
                        );
                      }
                      return cells;
                    })()}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Bar Chart Tooltip Modal */}
          {showBarTooltip && (
            <View style={styles.modalOverlayWrapper}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowBarTooltip(false)}
              />

              <View style={[styles.barTooltipContainer]}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipTitle}>
                    {tooltipType === "retailer" ? "Retailers" : "Vendors"}
                  </Text>
                  <TouchableOpacity onPress={() => setShowBarTooltip(false)}>
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.tooltipContent}>
                  {/* Approved */}
                  {/* Approved */}
                  <View style={styles.tooltipSection}>
                    <View style={styles.tooltipSectionHeader}>
                      <Text
                        style={[
                          styles.tooltipSectionTitle,
                          { color: "#15803D" },
                        ]}
                      >
                        Approved (
                        {tooltipType === "retailer"
                          ? retailerStats?.approved || 0
                          : vendorStats?.approved || 0}
                        )
                      </Text>
                    </View>
                    {tooltipDetails.approved.map((item, index) => (
                      <View key={index} style={styles.tooltipItemRow}>
                        <Ionicons name="checkmark" size={14} color="#1D4ED8" />
                        <Text style={styles.tooltipItemText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Pending */}
                  <View style={styles.tooltipSection}>
                    <View style={styles.tooltipSectionHeader}>
                      <Text
                        style={[
                          styles.tooltipSectionTitle,
                          { color: "#A16207" },
                        ]}
                      >
                        Pending (
                        {tooltipType === "retailer"
                          ? retailerStats?.pending || 0
                          : vendorStats?.pending || 0}
                        )
                      </Text>
                    </View>
                    {tooltipDetails.pending.map((item, index) => (
                      <View key={index} style={styles.tooltipItemRow}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.tooltipItemText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Rejected */}
                  <View style={styles.tooltipSection}>
                    <View style={styles.tooltipSectionHeader}>
                      <Text
                        style={[
                          styles.tooltipSectionTitle,
                          { color: "#B91C1C" },
                        ]}
                      >
                        Rejected (
                        {tooltipType === "retailer"
                          ? retailerStats?.rejected || 0
                          : vendorStats?.rejected || 0}
                        )
                      </Text>
                    </View>
                    {tooltipDetails.rejected.map((item, index) => (
                      <View key={index} style={styles.tooltipItemRow}>
                        <Ionicons
                          name="close-circle-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.tooltipItemText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>

                  {/* New */}
                  <View style={styles.tooltipSection}>
                    <View style={styles.tooltipSectionHeader}>
                      <Text
                        style={[
                          styles.tooltipSectionTitle,
                          { color: "#1D4ED8" },
                        ]}
                      >
                        New (
                        {tooltipType === "retailer"
                          ? retailerStats?.new || 0
                          : vendorStats?.new || 0}
                        )
                      </Text>
                    </View>
                    {tooltipDetails.new.map((item, index) => (
                      <View key={index} style={styles.tooltipItemRow}>
                        <Ionicons
                          name="ellipse"
                          size={8}
                          color="#3B82F6"
                          style={{ marginLeft: 3, marginRight: 3 }}
                        />
                        <Text style={styles.tooltipItemText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Chart Section */}
          <StackedBar />

          {/* Summary Cards Grid */}
          <View style={styles.sumGrid}>
            <SummaryCard title="Total Retailers" stats={retailerStats} />
            <SummaryCard title="Total Vendors" stats={vendorStats} />
          </View>



          {/* Back to Home Button */}
          <TouchableOpacity
            style={styles.backHomeBtnContainer}
            onPress={() => router.replace("/onboarding-type")}
          >
            <LinearGradient
              colors={["#9333ea", "#a855f7", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.backHomeBtn}
            >
              <Text style={styles.backHomeText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E212E", // Dark background from reference
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1E212E",
    justifyContent: "center",
    alignItems: "center",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
  },
  logo: {
    width: 300,
    height: 130,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#A855F7",
    borderRadius: 8,
    padding: 2,
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    zIndex: 100, // Ensure dropdowns appear above chart
  },
  dashboardTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
  },
  analyticsTitle: {
    color: "#94A3B8",
    fontSize: 24,
    marginTop: -5,
  },
  monthDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  monthText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  chartContainer: {
    marginBottom: 30,
  },
  chartMainTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
  },
  chartBody: {
    flexDirection: "row",
    height: 240,
  },
  yAxis: {
    justifyContent: "space-between",
    paddingRight: 12,
    paddingBottom: 20,
  },
  yAxisText: {
    color: "#64748B",
    fontSize: 12,
  },
  chartArea: {
    flex: 1,
    position: "relative",
  },
  gridLinesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    width: "100%",
  },
  barsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: 20,
    zIndex: 10,
  },
  barGroup: {
    alignItems: "center",
    width: 80,
  },
  barContainer: {
    width: 40,
    height: 200,
    justifyContent: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 4,
  },
  barSegment: {
    width: "100%",
  },
  barLabelText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 12,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    color: "#94A3B8",
    fontSize: 13,
  },
  sumGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
  },
  sumCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  sumCardTitle: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 16,
  },
  sumCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sumItem: {
    alignItems: "flex-start",
  },
  sumLabel: {
    color: "#64748B",
    fontSize: 11,
    marginBottom: 4,
  },
  sumValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sumDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 12,
  },
  moreBtn: {
    alignSelf: "center",
  },
  moreText: {
    color: "#A855F7",
    fontSize: 14,
    fontWeight: "600",
  },
  backHomeBtnContainer: {
    width: "100%",
    alignItems: "center",
  },
  backHomeBtn: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: "70%",
    alignItems: "center",
  },
  backHomeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlayWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent", // Transparent to see content or subtle dim
  },
  datePickerContainer: {
    position: "absolute",
    top: 65, // Positioned below the Month button
    right: 0,
    width: 480,
    backgroundColor: "#25293C",
    borderRadius: 24,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 101,
    ...Platform.select({
      web: {
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      },
    }),
  },
  dateSidebar: {
    width: 100,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.05)",
  },
  sidebarItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sidebarItemActive: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
  },
  sidebarText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
  sidebarTextActive: {
    color: "#A855F7",
    fontSize: 14,
    fontWeight: "700",
  },
  calendarContainer: {
    flex: 1,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarMonthYear: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  daysRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dayLabel: {
    color: "#64748B",
    fontSize: 12,
    width: 48,
    textAlign: "center",
  },
  datesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateCell: {
    width: 48,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  dateCellSelected: {
    backgroundColor: "rgba(168, 85, 247, 0.2)", // Very subtle tint
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  dateTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  xAxisRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  yAxisSpacer: {
    width: 30, // Matches yAxis width approx
  },
  xAxisLabelsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  xAxisLabel: {
    color: "#64748B",
    fontSize: 12,
    width: 80,
    textAlign: "center",
  },
  regionSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  regionSearchInput: {
    flex: 1,
    marginLeft: 10,
    color: "#FFFFFF",
    fontSize: 14,
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  regionListGrid: {
    flexDirection: "column",
    gap: 4,
  },
  regionItemCell: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  regionItemCellActive: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },
  regionItemText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  regionItemTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  regionApplyBtn: {
    backgroundColor: "#A855F7",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  regionApplyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  regionTabsHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
  },
  regionTabItem: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    position: "relative",
  },
  regionTabItemActive: {
    backgroundColor: "rgba(168, 85, 247, 0.05)",
  },
  regionTabText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },
  regionTabActiveText: {
    color: "#A855F7",
    fontSize: 14,
    fontWeight: "bold",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 3,
    backgroundColor: "#A855F7",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barTooltipContainer: {
    position: "absolute",
    top: "25%",
    left: "50%",
    marginLeft: -150, // Half of width to center
    width: 300,
    maxHeight: "50%",
    backgroundColor: "#1E212E", // Darker background to match image 1
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 20,
  },
  tooltipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  tooltipTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  tooltipContent: {
    padding: 20,
  },
  tooltipSection: {
    marginBottom: 16,
  },
  tooltipSectionHeader: {
    marginBottom: 8,
  },
  tooltipSectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  tooltipItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingLeft: 4,
  },
  tooltipItemText: {
    color: "#94A3B8",
    fontSize: 14,
    marginLeft: 8,
  },
  navMenuButton: {
    padding: 4,
  },
  navMenuDropdown: {
    position: "absolute",
    top: 80,
    left: 20,
    backgroundColor: "#1E212E",
    borderRadius: 12,
    padding: 8,
    zIndex: 2000,
    minWidth: 180,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      },
    }),
  },
  navMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderRadius: 8,
  },
  navMenuText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  navMenuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1500,
    backgroundColor: "transparent",
  },
  exportDropdownBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
    backgroundColor: "transparent",
    pointerEvents: "auto",
  },
  exportDropdown: {
    position: "absolute",
    top: 50,
    right: 0,
    backgroundColor: "#1E212E",
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    pointerEvents: "auto",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      },
    }),
  },
  exportOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderRadius: 8,
    pointerEvents: "auto",
    // Cursor pointer is handled by Pressable on hover usually, but explicit style helps
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "background-color 0.2s",
      },
    }),
  },
  exportOptionHovered: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  exportOptionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  exportDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 4,
  },
});
