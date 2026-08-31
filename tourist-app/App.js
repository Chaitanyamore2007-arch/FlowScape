import "react-native-url-polyfill/auto";
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ScrollView,
  ImageBackground,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "./supabase";
import Map, {
  Source,
  Layer,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ScaleControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

if (Platform.OS === "web") {
  const style = document.createElement("style");
  style.textContent = `html, body, #root { height: 100%; width: 100%; overflow: hidden; margin: 0; }`;
  document.head.appendChild(style);
}

import * as Location from "expo-location";

const CITY_CONFIG = {
  pune: {
    name: "Pune",
    center: [73.8553, 18.5195],
    zoom: 14,
    places: [
      "Shaniwar Wada",
      "Aga Khan Palace",
      "Pataleshwar Caves",
      "Dagdusheth Ganpati",
      "Sinhagad Fort",
      "Lal Mahal",
    ],
    coords: {
      "Shaniwar Wada": [73.8553, 18.5195],
      "Aga Khan Palace": [73.9015, 18.5523],
      "Pataleshwar Caves": [73.85, 18.5266],
      "Dagdusheth Ganpati": [73.856, 18.5163],
      "Sinhagad Fort": [73.7558, 18.3664],
      "Lal Mahal": [73.8568, 18.5148],
    },
    heatmapSites: [
      [73.8553, 18.5195],
      [73.85, 18.5266],
      [73.9015, 18.5523],
      [73.856, 18.5163],
      [73.8568, 18.5148],
    ],
    activityName: "Shaniwar Wada Heritage Walk",
    rushSite: "Dagdusheth Temple",
    trailName: "Peshwa Heritage Trail",
  },
  mumbai: {
    name: "Mumbai",
    center: [72.8347, 18.922],
    zoom: 13,
    places: [
      "Gateway of India",
      "Elephanta Caves",
      "CSMT",
      "Marine Drive",
      "Haji Ali Dargah",
      "Global Vipassana",
    ],
    coords: {
      "Gateway of India": [72.8347, 18.922],
      "Elephanta Caves": [72.9315, 18.9633],
      CSMT: [72.8347, 18.9398],
      "Marine Drive": [72.8258, 18.944],
      "Haji Ali Dargah": [72.8088, 18.9827],
      "Global Vipassana": [72.806, 19.2284],
    },
    heatmapSites: [
      [72.8347, 18.922],
      [72.9315, 18.9633],
      [72.8347, 18.9398],
      [72.8258, 18.944],
      [72.8088, 18.9827],
    ],
    activityName: "Colaba Heritage Walk",
    rushSite: "Gateway of India",
    trailName: "Bombay Deco Trail",
  },
  aurangabad: {
    name: "Aurangabad",
    center: [75.3236, 19.8762],
    zoom: 12,
    places: [
      "Ajanta Caves",
      "Ellora Caves",
      "Bibi Ka Maqbara",
      "Daulatabad Fort",
      "Grishneshwar Temple",
    ],
    coords: {
      "Ajanta Caves": [75.7033, 20.5519],
      "Ellora Caves": [75.1776, 20.0258],
      "Bibi Ka Maqbara": [75.3204, 19.8943],
      "Daulatabad Fort": [75.2152, 19.948],
      "Grishneshwar Temple": [75.1706, 20.0245],
    },
    heatmapSites: [
      [75.7033, 20.5519],
      [75.1776, 20.0258],
      [75.3204, 19.8943],
      [75.2152, 19.948],
      [75.1706, 20.0245],
    ],
    activityName: "Ellora Heritage Walk",
    rushSite: "Ajanta Caves",
    trailName: "Deccan History Trail",
  },
  nashik: {
    name: "Nashik",
    center: [73.7898, 19.9975],
    zoom: 13,
    places: [
      "Trimbakeshwar Temple",
      "Pandavleni Caves",
      "Sita Gufa",
      "Muktidham",
      "Kalaram Temple",
    ],
    coords: {
      "Trimbakeshwar Temple": [73.5303, 19.9324],
      "Pandavleni Caves": [73.7468, 19.9576],
      "Sita Gufa": [73.7915, 20.0075],
      Muktidham: [73.8242, 19.9803],
      "Kalaram Temple": [73.7925, 20.008],
    },
    heatmapSites: [
      [73.5303, 19.9324],
      [73.7468, 19.9576],
      [73.7915, 20.0075],
      [73.8242, 19.9803],
      [73.7925, 20.008],
    ],
    activityName: "Godavari Ghat Walk",
    rushSite: "Trimbakeshwar Temple",
    trailName: "Ancient Nashik Trail",
  },
  nagpur: {
    name: "Nagpur",
    center: [79.0882, 21.1458],
    zoom: 13,
    places: [
      "Deekshabhoomi",
      "Sitabuldi Fort",
      "Ambazari Lake",
      "Zero Mile Stone",
      "Raman Science Centre",
    ],
    coords: {
      Deekshabhoomi: [79.0573, 21.1278],
      "Sitabuldi Fort": [79.0874, 21.1437],
      "Ambazari Lake": [79.0264, 21.1235],
      "Zero Mile Stone": [79.0864, 21.1444],
      "Raman Science Centre": [79.0987, 21.1415],
    },
    heatmapSites: [
      [79.0573, 21.1278],
      [79.0874, 21.1437],
      [79.0264, 21.1235],
      [79.0864, 21.1444],
      [79.0987, 21.1415],
    ],
    activityName: "Zero Mile Heritage Walk",
    rushSite: "Deekshabhoomi",
    trailName: "Orange City Trail",
  },
  kolhapur: {
    name: "Kolhapur",
    center: [74.2433, 16.705],
    zoom: 13,
    places: [
      "Mahalakshmi Temple",
      "Panhala Fort",
      "New Palace",
      "Rankala Lake",
      "Jyotiba Temple",
    ],
    coords: {
      "Mahalakshmi Temple": [74.2272, 16.6946],
      "Panhala Fort": [74.113, 16.8159],
      "New Palace": [74.2384, 16.7202],
      "Rankala Lake": [74.212, 16.6908],
      "Jyotiba Temple": [74.1751, 16.8049],
    },
    heatmapSites: [
      [74.2272, 16.6946],
      [74.113, 16.8159],
      [74.2384, 16.7202],
      [74.212, 16.6908],
      [74.1751, 16.8049],
    ],
    activityName: "Mahalakshmi Temple Walk",
    rushSite: "Mahalakshmi Temple",
    trailName: "Maratha Heritage Trail",
  },
};

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiY2hhaXRhbnlhbW9yZSIsImEiOiJjbXQ5dmRyYjgwNHhuMnlzMXRiNzI5Z2JxIn0.ZuMDWt7m5FkbIJNVcdm7MA";

export default function App() {
  const [session, setSession] = useState(null);
  const [cityKey, setCityKey] = useState("pune");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((err) => console.error("Failed to get session:", err));

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location not granted");
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        let lat = loc.coords.latitude;
        let lon = loc.coords.longitude;

        let closest = "pune";
        let minDist = Infinity;
        for (const [key, city] of Object.entries(CITY_CONFIG)) {
          // simple squared distance
          const dist =
            Math.pow(city.center[1] - lat, 2) +
            Math.pow(city.center[0] - lon, 2);
          if (dist < minDist) {
            minDist = dist;
            closest = key;
          }
        }
        setCityKey(closest);
      } catch (e) {
        console.log("Location fetch failed, defaulting to Pune", e);
      }
    })();
  }, []);

  if (!session) {
    return (
      <AuthScreen setSession={setSession} cityData={CITY_CONFIG[cityKey]} />
    );
  }

  return <MainApp session={session} cityData={CITY_CONFIG[cityKey]} />;
}

function AuthScreen({ setSession, cityData }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (Platform.OS === "web") window.alert(error.message);
      else Alert.alert(error.message);
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (Platform.OS === "web") window.alert(error.message);
      else Alert.alert(error.message);
    } else {
      if (Platform.OS === "web") window.alert("Registration successful!");
      else Alert.alert("Registration successful!");
    }
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0a1628" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        {/* Branding */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#00c9b7",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: "#00c9b7",
              shadowOpacity: 0.4,
              shadowRadius: 20,
            }}
          >
            <MaterialIcons name="explore" size={36} color="#0a1628" />
          </View>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "800",
              color: "#ffffff",
              letterSpacing: -1,
            }}
          >
            FlowScape
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#8b9cc7",
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Live Heatmaps & Gamified Smart Routing{"\n"}
            {cityData.subtitle}
          </Text>
        </View>

        {/* Feature Pills */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 28,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(0,201,183,0.15)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(0,201,183,0.3)",
            }}
          >
            <Text style={{ color: "#00c9b7", fontSize: 12, fontWeight: "600" }}>
              AI Predictions
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "rgba(99,132,255,0.15)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(99,132,255,0.3)",
            }}
          >
            <Text style={{ color: "#6384ff", fontSize: 12, fontWeight: "600" }}>
              Live Heatmaps
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "rgba(255,183,77,0.15)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(255,183,77,0.3)",
            }}
          >
            <Text style={{ color: "#ffb74d", fontSize: 12, fontWeight: "600" }}>
              Earn Rewards
            </Text>
          </View>
        </View>

        {/* Login Card */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            padding: 24,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#ffffff",
              marginBottom: 20,
            }}
          >
            Get Started
          </Text>

          <TextInput
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              color: "#ffffff",
              borderColor: "rgba(255,255,255,0.12)",
              borderWidth: 1,
              fontSize: 15,
            }}
            placeholder="Email"
            placeholderTextColor="#5a6a8a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              color: "#ffffff",
              borderColor: "rgba(255,255,255,0.12)",
              borderWidth: 1,
              fontSize: 15,
            }}
            placeholder="Password"
            placeholderTextColor="#5a6a8a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={{
              backgroundColor: "#00c9b7",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: "#00c9b7",
              shadowOpacity: 0.3,
              shadowRadius: 12,
            }}
            onPress={signInWithEmail}
            disabled={loading}
          >
            <Text
              style={{ color: "#0a1628", fontWeight: "bold", fontSize: 16 }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 10,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
            }}
            onPress={signUpWithEmail}
            disabled={loading}
          >
            <Text style={{ color: "#8b9cc7", fontWeight: "600", fontSize: 15 }}>
              Create Account
            </Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 20,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            />
            <Text
              style={{ color: "#5a6a8a", marginHorizontal: 12, fontSize: 13 }}
            >
              or try it out
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: "rgba(0,201,183,0.15)",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(0,201,183,0.3)",
            }}
            onPress={() =>
              setSession({
                user: { email: "demo@flowscape.com", id: "demo-uuid-1234" },
              })
            }
          >
            <Text
              style={{ color: "#00c9b7", fontWeight: "bold", fontSize: 16 }}
            >
              Instant Demo Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text
          style={{
            color: "#3d4f6f",
            textAlign: "center",
            marginTop: 24,
            fontSize: 12,
          }}
        >
          Built for ASI Heritage Sites • Powered by ML
        </Text>
      </ScrollView>
    </View>
  );
}

function MainApp({ session, cityData }) {
  const [incentive, setIncentive] = useState("Checking density...");
  const [discount, setDiscount] = useState(0);
  const [activeTab, setActiveTab] = useState("Home");
  const [capacity, setCapacity] = useState(45);
  const [capacityStatus, setCapacityStatus] = useState("Moderate");
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [heatData, setHeatData] = useState(null);

  // Interactive Departure Time State
  const generateTimeOptions = () => {
    const now = new Date();
    const formatTime = (date) =>
      date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return [
      { time: "Depart Now", wait: 45, saved: 0, bonus: 10, tag: "Standard" },
      {
        time: formatTime(new Date(now.getTime() + 30 * 60000)),
        wait: 15,
        saved: 30,
        bonus: 150,
        tag: "Optimal",
      },
      {
        time: formatTime(new Date(now.getTime() + 120 * 60000)),
        wait: 10,
        saved: 35,
        bonus: 200,
        tag: "Best Reward",
      },
      {
        time: formatTime(new Date(now.getTime() + 240 * 60000)),
        wait: 55,
        saved: 0,
        bonus: 0,
        tag: "Peak Hours",
      },
    ];
  };
  const [timeOptions, setTimeOptions] = useState(generateTimeOptions());
  const [timeIndex, setTimeIndex] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const currentPlan = timeOptions[timeIndex];

  // Location & Search State
  const [selectedLocation, setSelectedLocation] = useState(
    "Detecting nearest location...",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchPlaces = cityData.places;
  const filteredPlaces = searchPlaces.filter((place) =>
    place.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const heatmapsWs = useRef(null);
  const alertsWs = useRef(null);
  const mapRef = useRef(null);

  const placeCoordinates = cityData.coords;

  useEffect(() => {
    setSelectedLocation(`${cityData.places[0]} (Live Status)`);
  }, [cityData]);

  useEffect(() => {
    const connectHeatmaps = () => {
      heatmapsWs.current = new WebSocket(
        "wss://flowscape.onrender.com/ws/heatmaps",
      );
      heatmapsWs.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "DENSITY_UPDATE") {
            const updates = msg.data;
            const hasRedZone = updates.some((u) => u.status === "RED");

            // Simulated Tourist Sites Heatmap based on City Context
            const siteCoordinates = cityData.heatmapSites;

            const geojson = {
              type: "FeatureCollection",
              features: updates.slice(0, 5).map((u, i) => ({
                type: "Feature",
                properties: {
                  status: i === 0 ? "RED" : i === 1 ? "YELLOW" : "GREEN",
                },
                geometry: {
                  type: "Point",
                  coordinates: siteCoordinates[i % siteCoordinates.length],
                },
              })),
            };
            setHeatData(geojson);

            if (hasRedZone) {
              setCapacity(88);
              setCapacityStatus("High");
              setIncentive(
                "Peak hours detected! Shift your departure time to avoid crowds and save.",
              );
              setDiscount(15);
            } else {
              setCapacity(45);
              setCapacityStatus("Moderate");
              setIncentive("Standard booking available.");
              setDiscount(0);
            }
          }
        } catch (e) {
          console.error("Heatmap WS parse error:", e);
        }
      };
      heatmapsWs.current.onerror = (err) =>
        console.error("Heatmap WS error:", err);
      heatmapsWs.current.onclose = () => setTimeout(connectHeatmaps, 3000);
    };

    const connectAlerts = () => {
      alertsWs.current = new WebSocket(
        "wss://flowscape.onrender.com/ws/alerts",
      );
      alertsWs.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ALERT") {
            setLiveAlerts((prev) => [
              { id: Date.now(), message: msg.message, time: "Just now" },
              ...prev,
            ]);
            if (Platform.OS === "web")
              window.alert("Emergency Broadcast\n\n" + msg.message);
            else Alert.alert("Emergency Broadcast", msg.message);
          }
        } catch (e) {
          console.error("Alert WS parse error:", e);
        }
      };
      alertsWs.current.onerror = (err) => console.error("Alert WS error:", err);
      alertsWs.current.onclose = () => setTimeout(connectAlerts, 3000);
    };

    connectHeatmaps();
    connectAlerts();

    return () => {
      if (heatmapsWs.current) heatmapsWs.current.close();
      if (alertsWs.current) alertsWs.current.close();
    };
  }, []);

  const handleBooking = async () => {
    try {
      const response = await fetch(
        "https://flowscape.onrender.com/bookings?user_id=" +
          (session?.user?.id || "anonymous"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venue_id: "123e4567-e89b-12d3-a456-426614174000",
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
          }),
        },
      );
      if (response.ok) {
        const msg =
          "Departure schedule confirmed! " +
          (currentPlan.bonus > 0
            ? "You've earned " +
              currentPlan.bonus +
              " Bonus Points for routing smartly."
            : "You earned 10 Points.");
        if (Platform.OS === "web") window.alert("Success\n\n" + msg);
        else Alert.alert("Success", msg);
      } else {
        const errMsg = "Scheduling failed. Please try again.";
        if (Platform.OS === "web") window.alert(errMsg);
        else Alert.alert("Error", errMsg);
      }
    } catch (e) {
      const errMsg =
        "Could not connect to the server. Check your internet connection.";
      if (Platform.OS === "web") window.alert(errMsg);
      else Alert.alert("Connection Error", errMsg);
    }
  };

  const TabButton = ({ name, icon }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === name && styles.tabButtonActive]}
      onPress={() => setActiveTab(name)}
    >
      <MaterialIcons
        name={icon}
        size={24}
        color={activeTab === name ? "#0b6e6e" : "#414750"}
        style={{ opacity: activeTab === name ? 1 : 0.6 }}
      />
      <Text
        style={[styles.tabText, activeTab === name && styles.tabTextActive]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {activeTab === "Notifications" ? (
            <TouchableOpacity
              onPress={() => setActiveTab("Home")}
              style={{ marginRight: 12 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#00497d" />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.headerTitle}>
            {activeTab === "Notifications" ? "Notifications" : "FlowScape"}
          </Text>
        </View>

        {activeTab !== "Notifications" && (
          <TouchableOpacity onPress={() => setActiveTab("Notifications")}>
            <MaterialIcons name="notifications" size={24} color="#414750" />
            {liveAlerts.length > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={[
          styles.contentArea,
          {
            display:
              activeTab === "Map" && Platform.OS === "web" ? "none" : "flex",
          },
        ]}
      >
        {activeTab === "Home" && (
          <View style={styles.tabContent}>
            <View style={styles.heroCard}>
              <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>{selectedLocation}</Text>
                <Text style={styles.heroSubtitle}>
                  Nearest Node • Live Tracking
                </Text>
                <View style={styles.capacityBadge}>
                  <View
                    style={[
                      styles.capacityDot,
                      {
                        backgroundColor:
                          capacityStatus === "High" ? "#ef4444" : "#f59e0b",
                      },
                    ]}
                  />
                  <View>
                    <Text style={styles.capacityLabel}>Current Capacity</Text>
                    <Text style={styles.capacityValue}>
                      {capacity}%{" "}
                      <Text style={styles.capacitySub}>({capacityStatus})</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {discount > 0 && (
              <View style={styles.savingsSection}>
                <Text style={styles.sectionTitle}>Smart Savings</Text>
                <Text style={styles.sectionSubtitle}>{incentive}</Text>

                <View style={styles.suggestionCard}>
                  <View>
                    <Text style={styles.suggestionTime}>
                      {new Date(Date.now() + 90 * 60000).toLocaleTimeString(
                        [],
                        { hour: "numeric", minute: "2-digit" },
                      )}
                    </Text>
                    <Text style={styles.suggestionSub}>Very Low Crowd</Text>
                  </View>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>Save {discount}%</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.bookingCard}>
              <Text style={styles.sectionTitle}>Smart Departure Plan</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Departure Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color: "#00497d",
                        textDecorationLine: "underline",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {currentPlan.time} ▼
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expected Wait Time</Text>
                <Text style={styles.detailValue}>{currentPlan.wait} mins</Text>
              </View>
              {currentPlan.saved > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Smart Routing</Text>
                  <Text style={styles.detailDiscount}>
                    -{currentPlan.saved} mins
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.detailRow,
                  {
                    borderTopWidth: 1,
                    borderColor: "#e1e2e8",
                    marginTop: 10,
                    paddingTop: 10,
                  },
                ]}
              >
                <Text style={styles.totalLabel}>Bonus Reward</Text>
                <Text style={styles.totalValue}>+{currentPlan.bonus} pts</Text>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleBooking}
              >
                <Text style={styles.primaryButtonText}>
                  Commit to Departure →
                </Text>
              </TouchableOpacity>
            </View>
            {showTimePicker && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "#ffffff",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  shadowColor: "#000",
                  shadowOpacity: 0.2,
                  shadowRadius: 10,
                  elevation: 10,
                  zIndex: 100,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#191c20",
                    marginBottom: 16,
                  }}
                >
                  Select Departure Time
                </Text>
                {timeOptions.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 16,
                      borderBottomWidth: i === timeOptions.length - 1 ? 0 : 1,
                      borderColor: "#f2f3f9",
                    }}
                    onPress={() => {
                      setTimeIndex(i);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        color: timeIndex === i ? "#00497d" : "#191c20",
                        fontWeight: timeIndex === i ? "bold" : "normal",
                      }}
                    >
                      {opt.time}
                    </Text>
                    <View
                      style={{
                        backgroundColor: opt.bonus > 0 ? "#d1e4ff" : "#ffdad6",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: opt.bonus > 0 ? "#00497d" : "#93000a",
                          fontWeight: "bold",
                        }}
                      >
                        {opt.tag}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { marginTop: 8, backgroundColor: "#f2f3f9" },
                  ]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={{ color: "#414750", fontWeight: "bold" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === "Map" && Platform.OS !== "web" && (
          <View style={styles.tabContent}>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapTitle}>Live Map View</Text>
              <Text style={styles.mapSubtitle}>
                Check the web version to view the interactive map.
              </Text>
            </View>
          </View>
        )}

        {activeTab === "Rewards" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Suggested Paths</Text>
            <Text style={styles.sectionSubtitle}>
              Avoid the rush and discover hidden gems.
            </Text>

            <View style={styles.pathCard}>
              <ImageBackground
                source={{
                  uri: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80",
                }}
                style={styles.pathImage}
              >
                <View style={styles.pathOverlay}>
                  <View style={styles.gemBadge}>
                    <Text style={styles.gemBadgeText}>Hidden Gem</Text>
                  </View>
                  <Text style={styles.pathTitle}>{cityData.trailName}</Text>
                  <View style={styles.densityBadge}>
                    <Text style={styles.densityBadgeText}>Low Crowd</Text>
                  </View>
                </View>
              </ImageBackground>
              <View style={styles.pathFooter}>
                <View>
                  <Text style={styles.pathPoints}>+150 Pts</Text>
                  <Text style={styles.pathMeta}>1.9 km • 25 min</Text>
                </View>
                <TouchableOpacity style={styles.startButton}>
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pointsCard}>
              <Text style={styles.pointsLabel}>CURRENT BALANCE</Text>
              <Text style={styles.pointsValue}>
                4,200 <Text style={styles.pointsUnit}>pts</Text>
              </Text>

              <View style={styles.levelRow}>
                <Text style={styles.levelText}>Heritage Explorer (Lv. 4)</Text>
                <Text style={styles.levelText}>800 to next</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: "60%" }]} />
              </View>
              <Text style={styles.pointsHint}>
                Earn more points by departing during green zones.
              </Text>
            </View>
          </View>
        )}

        {activeTab === "Profile" && (
          <View style={styles.tabContent}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View
                  style={[
                    styles.avatarImage,
                    {
                      backgroundColor: "#00497d",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Text
                    style={{ fontSize: 48, color: "#fff", fontWeight: "bold" }}
                  >
                    {session?.user?.email
                      ? session.user.email[0].toUpperCase()
                      : "G"}
                  </Text>
                </View>
              </View>
              <Text style={styles.profileName}>
                {session?.user?.email
                  ? session.user.email.split("@")[0]
                  : "Guest Explorer"}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>Heritage Explorer</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Sites Visited</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>4</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>$15</Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityList}>
              <View style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>
                    {cityData.activityName}
                  </Text>
                  <Text style={styles.activityMeta}>Today • 5.1 km</Text>
                </View>
                <View style={styles.activityPoints}>
                  <Text style={styles.activitySaved}>Saved 12 mins</Text>
                  <Text style={styles.activityScore}>+50 pts</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => supabase.auth.signOut()}
            >
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "Notifications" && (
          <View style={styles.tabContent}>
            <View style={styles.alertCardRed}>
              <Text style={styles.alertTitleRed}>⚠️ High Density Alert</Text>
              <Text style={styles.alertDescRed}>
                Sudden crowd surge at {cityData.rushSite}. Re-routing
                recommended for safety.
              </Text>
              <Text style={styles.alertTime}>Just now</Text>
            </View>

            {liveAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertCardRed}>
                <Text style={styles.alertTitleRed}>⚠️ Emergency Broadcast</Text>
                <Text style={styles.alertDescRed}>{alert.message}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            ))}

            <View style={styles.notificationCard}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{ fontWeight: "bold", color: "#191c20", fontSize: 16 }}
                >
                  Points Awarded
                </Text>
                <Text style={{ color: "#414750", fontSize: 12 }}>1h ago</Text>
              </View>
              <Text style={{ color: "#414750" }}>
                You earned 50 pts for avoiding the {cityData.rushSite} rush!
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Web Map Rendering */}
      {activeTab === "Map" && Platform.OS === "web" && (
        <View style={{ flex: 1, position: "relative" }}>
          {/* Floating Search Bar */}
          <View
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 64,
              zIndex: 10,
            }}
          >
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: showSuggestions ? 16 : 24,
                borderBottomLeftRadius: showSuggestions ? 0 : 24,
                borderBottomRightRadius: showSuggestions ? 0 : 24,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                height: 48,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <MaterialIcons name="menu" size={24} color="#414750" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: "#191c20",
                  outlineStyle: "none",
                }}
                placeholder="Where to?"
                placeholderTextColor="#73777f"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSuggestions(text.length > 0);
                }}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  <MaterialIcons
                    name="close"
                    size={20}
                    color="#414750"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              ) : (
                <MaterialIcons
                  name="mic"
                  size={24}
                  color="#414750"
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && filteredPlaces.length > 0 && (
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  paddingVertical: 8,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                {filteredPlaces.map((place, i, arr) => (
                  <TouchableOpacity
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                      borderColor: "#f2f3f9",
                    }}
                    onPress={() => {
                      setSelectedLocation(place);
                      setSearchQuery("");
                      setShowSuggestions(false);

                      // Google Maps Style Fly-To Camera Animation
                      const coords = placeCoordinates[place];
                      if (coords && mapRef.current) {
                        mapRef.current.flyTo({
                          center: coords,
                          zoom: 15,
                          duration: 2500,
                        });
                      }
                    }}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color="#73777f"
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ fontSize: 16, color: "#191c20" }}>
                      {place}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* AI Prediction Toggle */}
          <View
            style={{
              position: "absolute",
              top: 80,
              left: 16,
              zIndex: 9,
              backgroundColor: "#ffffff",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MaterialIcons
              name="auto-awesome"
              size={20}
              color="#0061a4"
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontWeight: "bold", color: "#00497d" }}>
              AI Traffic Prediction: +2 Hrs
            </Text>
          </View>

          {/* Map Legend */}
          <View
            style={{
              position: "absolute",
              bottom: 32,
              left: 16,
              zIndex: 10,
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: 12,
              padding: 12,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: "#191c20",
                marginBottom: 6,
              }}
            >
              Density Level
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#ef4444",
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 11, color: "#414750" }}>
                High (Severe Delays)
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#f59e0b",
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 11, color: "#414750" }}>Moderate</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#10b981",
                  marginRight: 8,
                }}
              />
              <Text style={{ fontSize: 11, color: "#414750" }}>
                Low (Optimal)
              </Text>
            </View>
          </View>

          <Map
            key={cityData.name}
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: cityData.center[0],
              latitude: cityData.center[1],
              zoom: cityData.zoom,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/traffic-day-v2"
          >
            <GeolocateControl
              position="top-right"
              positionOptions={{ enableHighAccuracy: true }}
              trackUserLocation={true}
              showUserHeading={true}
            />
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
            <ScaleControl position="bottom-right" />
            {heatData && (
              <Source id="heat-zones" type="geojson" data={heatData}>
                <Layer
                  id="heat-zones-layer"
                  type="circle"
                  paint={{
                    "circle-color": [
                      "match",
                      ["get", "status"],
                      "RED",
                      "#ef4444",
                      "YELLOW",
                      "#f59e0b",
                      "GREEN",
                      "#10b981",
                      "#ccc",
                    ],
                    "circle-radius": 40,
                    "circle-opacity": 0.6,
                    "circle-blur": 0.8,
                  }}
                />
              </Source>
            )}
          </Map>
        </View>
      )}

      {/* Bottom Tab Navigation */}
      {activeTab !== "Notifications" && (
        <View style={styles.tabBar}>
          <TabButton name="Home" icon="home" />
          <TabButton name="Map" icon="map" />
          <TabButton name="Rewards" icon="stars" />
          <TabButton name="Profile" icon="person" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f1f3f9",
  },
  headerTitle: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  contentArea: { flex: 1 },
  tabContent: { padding: 24 },

  heroCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    height: 220,
    marginBottom: 32,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    padding: 24,
    justifyContent: "flex-end",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "#94a3b8",
    fontSize: 15,
    marginBottom: 16,
    fontWeight: "500",
  },
  capacityBadge: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  capacityDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  capacityLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  capacityValue: { fontSize: 20, color: "#0f172a", fontWeight: "900" },
  capacitySub: { fontSize: 14, fontWeight: "600", color: "#475569" },

  savingsSection: {
    backgroundColor: "#f0fdfa",
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderColor: "#ccfbf1",
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 20,
    fontWeight: "500",
  },
  suggestionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  suggestionTime: { fontSize: 18, color: "#0f172a", fontWeight: "700" },
  suggestionSub: {
    fontSize: 13,
    color: "#0d9488",
    marginTop: 4,
    fontWeight: "600",
  },
  discountBadge: {
    backgroundColor: "#ccfbf1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  discountText: { color: "#0f766e", fontWeight: "800", fontSize: 13 },

  bookingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 15, color: "#64748b", fontWeight: "500" },
  detailValue: { fontSize: 15, color: "#0f172a", fontWeight: "700" },
  detailDiscount: { fontSize: 15, color: "#0d9488", fontWeight: "700" },
  totalLabel: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  totalValue: { fontSize: 24, fontWeight: "900", color: "#6366f1" },
  primaryButton: {
    backgroundColor: "#6366f1",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "800", fontSize: 17 },

  mapPlaceholder: {
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  viewAllText: { color: "#6366f1", fontSize: 15, fontWeight: "700" },
  pathCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  pathImage: { height: 180, justifyContent: "flex-end" },
  pathOverlay: { backgroundColor: "rgba(15,23,42,0.4)", padding: 16 },
  gemBadge: {
    backgroundColor: "#fef08a",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  gemBadgeText: {
    fontSize: 11,
    color: "#854d0e",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  pathTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  densityBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  densityBadgeText: { fontSize: 13, color: "#0f172a", fontWeight: "700" },
  pathFooter: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pathPoints: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "800",
    marginBottom: 4,
  },
  pathMeta: { fontSize: 15, color: "#64748b", fontWeight: "500" },
  startButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  startButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },

  pointsCard: {
    backgroundColor: "#6366f1",
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    marginTop: 8,
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  pointsLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pointsValue: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "900",
    marginVertical: 8,
    letterSpacing: -1,
  },
  pointsUnit: { fontSize: 20, fontWeight: "600", opacity: 0.9 },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  levelText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: { height: 12, backgroundColor: "#34d399", borderRadius: 6 },
  pointsHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 12,
    fontWeight: "500",
  },

  profileHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#f8faff",
  },
  profileName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  levelBadge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadgeText: { color: "#4338ca", fontSize: 14, fontWeight: "800" },
  statsGrid: { flexDirection: "row", gap: 16, marginBottom: 32 },
  statBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activityList: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  activityItem: {
    flexDirection: "row",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  activityInfo: { flex: 1 },
  activityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  activityMeta: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  activityPoints: { alignItems: "flex-end" },
  activitySaved: {
    fontSize: 13,
    color: "#0d9488",
    marginBottom: 4,
    fontWeight: "600",
  },
  activityScore: { fontSize: 15, fontWeight: "800", color: "#6366f1" },
  logoutButton: {
    backgroundColor: "#fef2f2",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 32,
  },
  logoutText: { color: "#ef4444", fontWeight: "800", fontSize: 16 },

  input: {
    backgroundColor: "#f8faff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "500",
  },

  alertCardRed: {
    backgroundColor: "#fef2f2",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderColor: "#fca5a5",
    borderWidth: 1,
  },
  alertTitleRed: {
    fontSize: 17,
    fontWeight: "800",
    color: "#b91c1c",
    marginBottom: 4,
  },
  alertDescRed: { fontSize: 15, color: "#991b1b", lineHeight: 22 },
  alertTime: {
    fontSize: 13,
    color: "#ef4444",
    marginTop: 12,
    fontWeight: "600",
  },
  notificationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 16,
  },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabButtonActive: {
    backgroundColor: "#f1f5f9",
    borderRadius: 24,
    marginHorizontal: 12,
  },
  tabText: { fontSize: 12, color: "#64748b", marginTop: 6, fontWeight: "600" },
  tabTextActive: { color: "#0f172a", fontWeight: "800" },
});
