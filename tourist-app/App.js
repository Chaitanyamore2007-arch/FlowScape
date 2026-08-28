import 'react-native-url-polyfill/auto';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Alert, SafeAreaView, TouchableOpacity, Platform, ScrollView, ImageBackground, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from './supabase';
import Map, { Source, Layer, NavigationControl, GeolocateControl, FullscreenControl, ScaleControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hhaXRhbnlhbW9yZSIsImEiOiJjbXQ5dmRyYjgwNHhuMnlzMXRiNzI5Z2JxIn0.ZuMDWt7m5FkbIJNVcdm7MA';

export default function App() {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!session) {
    return <AuthScreen setSession={setSession} />;
  }

  return <MainApp session={session} />;
}

function AuthScreen({ setSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
       if (Platform.OS === 'web') window.alert(error.message);
       else Alert.alert(error.message);
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
       if (Platform.OS === 'web') window.alert(error.message);
       else Alert.alert(error.message);
    } else {
       if (Platform.OS === 'web') window.alert('Registration successful!');
       else Alert.alert('Registration successful!');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={{flex:1, justifyContent: 'center', padding: 20}}>
            <Text style={{fontSize: 32, fontWeight: 'bold', color: '#00497d', textAlign: 'center', marginBottom: 10}}>FlowScape</Text>
            <Text style={{fontSize: 16, color: '#414750', textAlign: 'center', marginBottom: 40}}>Smart Routing & Gamification</Text>
            
            <View style={{backgroundColor: '#ffffff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2}}>
                <Text style={{fontSize: 20, fontWeight: 'bold', color: '#191c20', marginBottom: 20}}>Sign In / Sign Up</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                
                <TouchableOpacity style={styles.primaryButton} onPress={signInWithEmail} disabled={loading}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Loading...' : 'Sign In'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, {backgroundColor: 'transparent', borderWidth: 1, borderColor: '#00497d', marginTop: 10}]} onPress={signUpWithEmail} disabled={loading}>
                    <Text style={[styles.primaryButtonText, {color: '#00497d'}]}>Create Account</Text>
                </TouchableOpacity>

                <View style={{flexDirection: 'row', alignItems: 'center', marginVertical: 20}}>
                    <View style={{flex: 1, height: 1, backgroundColor: '#e1e2e8'}} />
                    <Text style={{color: '#73777f', marginHorizontal: 10}}>OR</Text>
                    <View style={{flex: 1, height: 1, backgroundColor: '#e1e2e8'}} />
                </View>

                <TouchableOpacity style={[styles.primaryButton, {backgroundColor: '#9deeed', marginTop: 0}]} onPress={() => setSession({ user: { email: 'demo@flowscape.com', id: 'demo-uuid-1234' } })}>
                    <Text style={[styles.primaryButtonText, {color: '#00497d'}]}>🚀 Instant Demo Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    </SafeAreaView>
  );
}

function MainApp({ session }) {
  const [incentive, setIncentive] = useState('Checking density...');
  const [discount, setDiscount] = useState(0);
  const [activeTab, setActiveTab] = useState('Home');
  const [capacity, setCapacity] = useState(45);
  const [capacityStatus, setCapacityStatus] = useState('Moderate');
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [heatData, setHeatData] = useState(null);
  
  // Interactive Departure Time State
  const generateTimeOptions = () => {
      const now = new Date();
      const formatTime = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return [
          { time: 'Depart Now', wait: 45, saved: 0, bonus: 10, tag: 'Standard' },
          { time: formatTime(new Date(now.getTime() + 30 * 60000)), wait: 15, saved: 30, bonus: 150, tag: 'Optimal' },
          { time: formatTime(new Date(now.getTime() + 120 * 60000)), wait: 10, saved: 35, bonus: 200, tag: 'Best Reward' },
          { time: formatTime(new Date(now.getTime() + 240 * 60000)), wait: 55, saved: 0, bonus: 0, tag: 'Peak Hours' }
      ];
  };
  const [timeOptions, setTimeOptions] = useState(generateTimeOptions());
  const [timeIndex, setTimeIndex] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const currentPlan = timeOptions[timeIndex];
  
  // Location & Search State
  const [selectedLocation, setSelectedLocation] = useState('Detecting nearest location...');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchPlaces = ['Central Park', 'Times Square', 'Empire State Building', 'Grand Central Station', 'Statue of Liberty', 'Brooklyn Bridge'];
  const filteredPlaces = searchPlaces.filter(place => place.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const heatmapsWs = useRef(null);
  const alertsWs = useRef(null);
  const mapRef = useRef(null);

  const placeCoordinates = {
      'Central Park': [-73.965, 40.782],
      'Times Square': [-73.985, 40.758],
      'Empire State Building': [-73.985, 40.748],
      'Grand Central Station': [-73.976, 40.753],
      'Statue of Liberty': [-74.044, 40.689],
      'Brooklyn Bridge': [-73.996, 40.706]
  };

  useEffect(() => {
    // Simulate GPS Nearest Node Detection
    const gpsTimer = setTimeout(() => {
        setSelectedLocation(prev => prev === 'Detecting nearest location...' ? 'Central Park (Nearest Node)' : prev);
    }, 2000);

    heatmapsWs.current = new WebSocket('wss://changelog-seating-groundwater-horses.trycloudflare.com/ws/heatmaps');
    heatmapsWs.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'DENSITY_UPDATE') {
        const updates = msg.data;
        const hasRedZone = updates.some(u => u.status === 'RED');
        
        // Build GeoJSON for the Map
        const geojson = {
          type: 'FeatureCollection',
          features: updates.map(u => ({
             type: 'Feature',
             properties: { status: u.status },
             geometry: {
                 type: 'Polygon',
                 coordinates: [u.zone_id.includes('b3') ? 
                   [[-73.978, 40.753], [-73.976, 40.753], [-73.976, 40.751], [-73.978, 40.751], [-73.978, 40.753]] 
                   :
                   [[-73.976, 40.755], [-73.974, 40.755], [-73.974, 40.753], [-73.976, 40.753], [-73.976, 40.755]] 
                 ]
             }
          }))
        };
        setHeatData(geojson);

        if (hasRedZone) {
          setCapacity(88);
          setCapacityStatus('High');
          setIncentive('Peak hours detected! Shift your departure time to avoid crowds and save.');
          setDiscount(15);
        } else {
          setCapacity(45);
          setCapacityStatus('Moderate');
          setIncentive('Standard booking available.');
          setDiscount(0);
        }
      }
    };

    alertsWs.current = new WebSocket('wss://changelog-seating-groundwater-horses.trycloudflare.com/ws/alerts');
    alertsWs.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'ALERT') {
        setLiveAlerts(prev => [{ id: Date.now(), message: msg.message, time: 'Just now' }, ...prev]);
        if (Platform.OS === 'web') window.alert("Emergency Broadcast\n\n" + msg.message);
        else Alert.alert("Emergency Broadcast", msg.message);
      }
    };

    return () => {
      if (heatmapsWs.current) heatmapsWs.current.close();
      if (alertsWs.current) alertsWs.current.close();
    };
  }, []);

  const handleBooking = async () => {
    try {
        const response = await fetch('https://changelog-seating-groundwater-horses.trycloudflare.com/bookings?user_id=' + session.user.id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                venue_id: '123e4567-e89b-12d3-a456-426614174000',
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 3600000).toISOString()
            })
        });
        if (response.ok) {
            const msg = "Departure schedule confirmed! " + (discount > 0 ? "You've earned 150 Bonus Points for routing smartly." : "You earned 20 Points.");
            if (Platform.OS === 'web') window.alert("Success\n\n" + msg);
            else Alert.alert("Success", msg);
        } else {
            if (Platform.OS === 'web') window.alert("Scheduling Failed");
        }
    } catch (e) {
        if (Platform.OS === 'web') window.alert("Error connecting to backend");
    }
  };

  const TabButton = ({ name, icon }) => (
    <TouchableOpacity 
      style={[styles.tabButton, activeTab === name && styles.tabButtonActive]} 
      onPress={() => setActiveTab(name)}
    >
      <MaterialIcons name={icon} size={24} color={activeTab === name ? '#0b6e6e' : '#414750'} style={{ opacity: activeTab === name ? 1 : 0.6 }} />
      <Text style={[styles.tabText, activeTab === name && styles.tabTextActive]}>{name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {activeTab === 'Notifications' ? (
            <TouchableOpacity onPress={() => setActiveTab('Home')} style={{marginRight: 12}}>
              <MaterialIcons name="arrow-back" size={24} color="#00497d" />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.headerTitle}>{activeTab === 'Notifications' ? 'Notifications' : 'FlowScape'}</Text>
        </View>
        
        {activeTab !== 'Notifications' && (
          <TouchableOpacity onPress={() => setActiveTab('Notifications')}>
            <MaterialIcons name="notifications" size={24} color="#414750" />
            {liveAlerts.length > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={[styles.contentArea, { display: activeTab === 'Map' && Platform.OS === 'web' ? 'none' : 'flex' }]}>
        {activeTab === 'Home' && (
          <View style={styles.tabContent}>
            <View style={styles.heroCard}>
                <View style={styles.heroOverlay}>
                    <Text style={styles.heroTitle}>{selectedLocation}</Text>
                    <Text style={styles.heroSubtitle}>Nearest Node • Live Tracking</Text>
                    <View style={styles.capacityBadge}>
                        <View style={[styles.capacityDot, { backgroundColor: capacityStatus === 'High' ? '#ef4444' : '#f59e0b' }]} />
                        <View>
                            <Text style={styles.capacityLabel}>Current Capacity</Text>
                            <Text style={styles.capacityValue}>{capacity}% <Text style={styles.capacitySub}>({capacityStatus})</Text></Text>
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
                            <Text style={styles.suggestionTime}>11:30 AM</Text>
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
                        <Text style={[styles.detailValue, { color: '#00497d', textDecorationLine: 'underline', fontWeight: 'bold' }]}>{currentPlan.time} ▼</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expected Wait Time</Text>
                    <Text style={styles.detailValue}>{currentPlan.wait} mins</Text>
                </View>
                {currentPlan.saved > 0 && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Smart Routing</Text>
                        <Text style={styles.detailDiscount}>-{currentPlan.saved} mins</Text>
                    </View>
                )}
                
                <View style={[styles.detailRow, { borderTopWidth: 1, borderColor: '#e1e2e8', marginTop: 10, paddingTop: 10 }]}>
                    <Text style={styles.totalLabel}>Bonus Reward</Text>
                    <Text style={styles.totalValue}>+{currentPlan.bonus} pts</Text>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleBooking}>
                    <Text style={styles.primaryButtonText}>Commit to Departure →</Text>
                </TouchableOpacity>
            </View>
            {showTimePicker && (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, zIndex: 100 }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#191c20', marginBottom: 16 }}>Select Departure Time</Text>
                  {timeOptions.map((opt, i) => (
                      <TouchableOpacity 
                          key={i} 
                          style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: i === 2 ? 0 : 1, borderColor: '#f2f3f9' }}
                          onPress={() => { setTimeIndex(i); setShowTimePicker(false); }}
                      >
                          <Text style={{ fontSize: 18, color: timeIndex === i ? '#00497d' : '#191c20', fontWeight: timeIndex === i ? 'bold' : 'normal' }}>{opt.time}</Text>
                          <View style={{ backgroundColor: opt.bonus > 0 ? '#d1e4ff' : '#ffdad6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                              <Text style={{ fontSize: 12, color: opt.bonus > 0 ? '#00497d' : '#93000a', fontWeight: 'bold' }}>{opt.tag}</Text>
                          </View>
                      </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.primaryButton, { marginTop: 8, backgroundColor: '#f2f3f9' }]} onPress={() => setShowTimePicker(false)}>
                      <Text style={{ color: '#414750', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Map' && Platform.OS !== 'web' && (
          <View style={styles.tabContent}>
            <View style={styles.mapPlaceholder}>
                <Text style={styles.mapTitle}>Live Map View</Text>
                <Text style={styles.mapSubtitle}>Check the web version to view the interactive map.</Text>
            </View>
          </View>
        )}

        {activeTab === 'Rewards' && (
          <View style={styles.tabContent}>
             <Text style={styles.sectionTitle}>Suggested Paths</Text>
             <Text style={styles.sectionSubtitle}>Avoid the rush and discover hidden gems.</Text>
             
             <View style={styles.pathCard}>
                <ImageBackground 
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAu8mUYCdw07aLb67otx-71V-TVddS3D8H1YXVQUxIj0y3QqTqwlIs_wGVxApEzS2KsrHdbJrbbCyzfRjkGlQQNqED8FrHuD9em-kLMv0ER16b2i1YHApuvuNVmsj1w1UT7b4PyX4Bt-cl9_-PZchBpZjtM8cy7ktUjf83lV1eJCesxUm3bE4Jn-ABvDyVcJMmNsD-ZgWyKlP9AcGWLmPpQi_gDSJwpHV5m1LtDLuskdmo6axwHlOL8' }} 
                    style={styles.pathImage}
                >
                    <View style={styles.pathOverlay}>
                        <View style={styles.gemBadge}><Text style={styles.gemBadgeText}>Hidden Gem</Text></View>
                        <Text style={styles.pathTitle}>The Artisan's Walk</Text>
                        <View style={styles.densityBadge}><Text style={styles.densityBadgeText}>Low Crowd</Text></View>
                    </View>
                </ImageBackground>
                <View style={styles.pathFooter}>
                    <View>
                        <Text style={styles.pathPoints}>+150 Pts</Text>
                        <Text style={styles.pathMeta}>1.2 mi • 25 min</Text>
                    </View>
                    <TouchableOpacity style={styles.startButton}><Text style={styles.startButtonText}>Start</Text></TouchableOpacity>
                </View>
             </View>

             <View style={styles.headerRow}>
                 <Text style={styles.sectionTitle}>Rewards</Text>
                 <Text style={styles.viewAllText}>View All</Text>
             </View>

             <View style={styles.pointsCard}>
                 <Text style={styles.pointsLabel}>CURRENT BALANCE</Text>
                 <Text style={styles.pointsValue}>2,450 <Text style={styles.pointsUnit}>pts</Text></Text>
                 
                 <View style={styles.levelRow}>
                     <Text style={styles.levelText}>Level 4 Explorer</Text>
                     <Text style={styles.levelText}>3,000 pts</Text>
                 </View>
                 <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: '82%' }]} /></View>
                 <Text style={styles.pointsHint}>550 pts to free museum entry</Text>
             </View>
          </View>
        )}

        {activeTab === 'Profile' && (
          <View style={styles.tabContent}>
             <View style={styles.profileHeader}>
                 <View style={styles.avatarContainer}>
                     <View style={[styles.avatarImage, { backgroundColor: '#00497d', alignItems: 'center', justifyContent: 'center' }]}>
                         <Text style={{ fontSize: 48, color: '#fff', fontWeight: 'bold' }}>
                             {session?.user?.email ? session.user.email[0].toUpperCase() : 'A'}
                         </Text>
                     </View>
                 </View>
                 <Text style={styles.profileName}>{session?.user?.email || 'Alex Miller'}</Text>
                 <View style={[styles.levelBadge, { backgroundColor: '#d1e4ff', marginTop: 4 }]}>
                     <Text style={[styles.levelBadgeText, { color: '#00497d' }]}>✓ Email Verified</Text>
                 </View>
                 <View style={[styles.levelBadge, { marginTop: 8 }]}>
                     <Text style={styles.levelBadgeText}>Level 4 Explorer</Text>
                 </View>
             </View>

             <View style={styles.statsGrid}>
                 <View style={styles.statBox}>
                     <Text style={styles.statValue}>245</Text>
                     <Text style={styles.statLabel}>TOTAL MILES</Text>
                 </View>
                 <View style={styles.statBox}>
                     <Text style={styles.statValue}>12</Text>
                     <Text style={styles.statLabel}>ROUTES SAVED</Text>
                 </View>
                 <View style={styles.statBox}>
                     <Text style={styles.statValue}>4.2k</Text>
                     <Text style={styles.statLabel}>POINTS EARNED</Text>
                 </View>
             </View>

             <Text style={styles.sectionTitle}>Recent Activity</Text>
             <View style={styles.activityList}>
                 <View style={styles.activityItem}>
                     <View style={styles.activityInfo}>
                         <Text style={styles.activityTitle}>Park Perimeter Path</Text>
                         <Text style={styles.activityMeta}>Today • 3.2 mi</Text>
                     </View>
                     <View style={styles.activityPoints}>
                         <Text style={styles.activitySaved}>Saved 15m</Text>
                         <Text style={styles.activityScore}>+50 pts</Text>
                     </View>
                 </View>
             </View>

             <TouchableOpacity style={styles.logoutButton} onPress={() => supabase.auth.signOut()}>
                 <Text style={styles.logoutText}>Log Out</Text>
             </TouchableOpacity>

          </View>
        )}

        {activeTab === 'Notifications' && (
          <View style={styles.tabContent}>
             <Text style={styles.sectionTitle}>Active Safety Alerts</Text>
             {liveAlerts.length === 0 ? (
                 <Text style={{color: '#414750', marginTop: 10}}>No active broadcasts from admin.</Text>
             ) : (
                 liveAlerts.map(alert => (
                    <View key={alert.id} style={styles.alertCardRed}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                            <MaterialIcons name="warning" size={20} color="#93000a" style={{marginRight: 8}} />
                            <Text style={styles.alertTitleRed}>Admin Broadcast</Text>
                        </View>
                        <Text style={styles.alertDescRed}>{alert.message}</Text>
                        <Text style={styles.alertTime}>{alert.time}</Text>
                    </View>
                 ))
             )}

             <Text style={[styles.sectionTitle, {marginTop: 24}]}>Recent Notifications</Text>
             <View style={styles.notificationCard}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                    <Text style={{fontWeight: 'bold', color: '#191c20', fontSize: 16}}>Reward Earned</Text>
                    <Text style={{color: '#414750', fontSize: 12}}>1h ago</Text>
                </View>
                <Text style={{color: '#414750'}}>You earned 50 pts for avoiding the Central Plaza rush!</Text>
             </View>
          </View>
        )}

      </ScrollView>

      {/* Web Map Rendering */}
      {activeTab === 'Map' && Platform.OS === 'web' && (
        <View style={{flex: 1, position: 'relative'}}>
          
          {/* Floating Search Bar */}
          <View style={{ position: 'absolute', top: 16, left: 16, right: 64, zIndex: 10 }}>
              <View style={{ backgroundColor: '#ffffff', borderRadius: showSuggestions ? 16 : 24, borderBottomLeftRadius: showSuggestions ? 0 : 24, borderBottomRightRadius: showSuggestions ? 0 : 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
                  <MaterialIcons name="menu" size={24} color="#414750" />
                  <TextInput 
                      style={{ flex: 1, marginLeft: 12, fontSize: 16, color: '#191c20', outlineStyle: 'none' }} 
                      placeholder="Where to?"
                      placeholderTextColor="#73777f"
                      value={searchQuery}
                      onChangeText={(text) => {
                          setSearchQuery(text);
                          setShowSuggestions(text.length > 0);
                      }}
                  />
                  {searchQuery.length > 0 ? (
                      <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); }}>
                          <MaterialIcons name="close" size={20} color="#414750" style={{ marginLeft: 8 }} />
                      </TouchableOpacity>
                  ) : (
                      <MaterialIcons name="mic" size={24} color="#414750" style={{ marginLeft: 8 }} />
                  )}
              </View>
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && filteredPlaces.length > 0 && (
                  <View style={{ backgroundColor: '#ffffff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
                      {filteredPlaces.map((place, i, arr) => (
                          <TouchableOpacity 
                              key={i} 
                              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderColor: '#f2f3f9' }}
                              onPress={() => {
                                  setSelectedLocation(place);
                                  setSearchQuery('');
                                  setShowSuggestions(false);
                                  
                                  // Google Maps Style Fly-To Camera Animation
                                  const coords = placeCoordinates[place];
                                  if (coords && mapRef.current) {
                                      mapRef.current.flyTo({ center: coords, zoom: 15, duration: 2500 });
                                  }
                              }}
                          >
                              <MaterialIcons name="location-on" size={20} color="#73777f" style={{ marginRight: 12 }} />
                              <Text style={{ fontSize: 16, color: '#191c20' }}>{place}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              )}
          </View>

          {/* AI Prediction Toggle */}
          <View style={{ position: 'absolute', top: 80, left: 16, zIndex: 9, backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, flexDirection: 'row', alignItems: 'center' }}>
             <MaterialIcons name="auto-awesome" size={20} color="#0061a4" style={{marginRight: 6}} />
             <Text style={{ fontWeight: 'bold', color: '#00497d' }}>AI Traffic Prediction: +2 Hrs</Text>
          </View>
          
          {/* Map Legend */}
          <View style={{ position: 'absolute', bottom: 32, left: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
             <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#191c20', marginBottom: 6 }}>Density Level</Text>
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                 <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', marginRight: 8 }} />
                 <Text style={{ fontSize: 11, color: '#414750' }}>High (Severe Delays)</Text>
             </View>
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                 <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#f59e0b', marginRight: 8 }} />
                 <Text style={{ fontSize: 11, color: '#414750' }}>Moderate</Text>
             </View>
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', marginRight: 8 }} />
                 <Text style={{ fontSize: 11, color: '#414750' }}>Low (Optimal)</Text>
             </View>
          </View>

          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: -73.976, latitude: 40.753, zoom: 15 }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/traffic-day-v2"
          >
            <GeolocateControl position="top-right" positionOptions={{enableHighAccuracy: true}} trackUserLocation={true} showUserHeading={true} />
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
            <ScaleControl position="bottom-right" />
            {heatData && (
              <Source id="heat-zones" type="geojson" data={heatData}>
                <Layer 
                  id="heat-zones-layer" 
                  type="fill" 
                  paint={{
                    'fill-color': [
                      'match', ['get', 'status'],
                      'RED', '#ef4444',
                      'YELLOW', '#f59e0b',
                      'GREEN', '#10b981',
                      '#ccc'
                    ],
                    'fill-opacity': 0.6
                  }}
                />
              </Source>
            )}
          </Map>
        </View>
      )}

      {/* Bottom Tab Navigation */}
      {activeTab !== 'Notifications' && (
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
  container: { flex: 1, backgroundColor: '#f8f9ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#f8f9ff', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e1e2e8' },
  headerTitle: { color: '#00497d', fontSize: 22, fontWeight: '700' },
  badge: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ba1a1a', borderWidth: 2, borderColor: '#f8f9ff' },
  contentArea: { flex: 1 },
  tabContent: { padding: 16 },
  
  heroCard: { backgroundColor: '#eceef3', borderRadius: 12, height: 200, marginBottom: 24, overflow: 'hidden' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 16, justifyContent: 'flex-end' },
  heroTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  heroSubtitle: { color: '#dcd6dc', fontSize: 14, marginBottom: 12 },
  capacityBadge: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  capacityDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  capacityLabel: { fontSize: 11, color: '#414750', textTransform: 'uppercase', fontWeight: 'bold' },
  capacityValue: { fontSize: 18, color: '#191c20', fontWeight: 'bold' },
  capacitySub: { fontSize: 14, fontWeight: 'normal', color: '#414750' },

  savingsSection: { backgroundColor: '#9deeed33', borderRadius: 12, padding: 16, marginBottom: 24, borderColor: '#9deeed', borderWidth: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#191c20', marginBottom: 8, marginTop: 10 },
  sectionSubtitle: { fontSize: 14, color: '#414750', marginBottom: 16 },
  suggestionCard: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  suggestionTime: { fontSize: 16, color: '#191c20', fontWeight: '500' },
  suggestionSub: { fontSize: 12, color: '#10b981', marginTop: 4 },
  discountBadge: { backgroundColor: '#006a6a1a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  discountText: { color: '#006a6a', fontWeight: '600' },

  bookingCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 14, color: '#414750' },
  detailValue: { fontSize: 14, color: '#191c20', fontWeight: '500' },
  detailDiscount: { fontSize: 14, color: '#006a6a', fontWeight: '500' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#191c20' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#00497d' },
  primaryButton: { backgroundColor: '#00497d', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  primaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  mapPlaceholder: { backgroundColor: '#eceef3', borderRadius: 12, padding: 24, alignItems: 'center' },
  mapTitle: { fontSize: 20, fontWeight: 'bold', color: '#191c20', marginBottom: 8 },
  mapSubtitle: { fontSize: 14, color: '#414750', textAlign: 'center', marginBottom: 24 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  viewAllText: { color: '#00497d', fontSize: 14, fontWeight: '500' },
  pathCard: { backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, marginBottom: 16 },
  pathImage: { height: 160, justifyContent: 'flex-end' },
  pathOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 12 },
  gemBadge: { backgroundColor: '#9deeed', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  gemBadgeText: { fontSize: 10, color: '#0b6e6e', fontWeight: 'bold' },
  pathTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  densityBadge: { backgroundColor: 'rgba(255,255,255,0.8)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  densityBadgeText: { fontSize: 12, color: '#191c20', fontWeight: 'bold' },
  pathFooter: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pathPoints: { fontSize: 12, color: '#414750', fontWeight: '600' },
  pathMeta: { fontSize: 14, color: '#191c20' },
  startButton: { backgroundColor: '#0061a4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  startButtonText: { color: '#ffffff', fontWeight: 'bold' },
  pointsCard: { backgroundColor: '#00497d', borderRadius: 12, padding: 20, marginBottom: 24, marginTop: 8 },
  pointsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold' },
  pointsValue: { color: '#ffffff', fontSize: 40, fontWeight: 'bold', marginVertical: 8 },
  pointsUnit: { fontSize: 20, fontWeight: 'normal', opacity: 0.8 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelText: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: '#9deeed', borderRadius: 4 },
  pointsHint: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 },

  profileHeader: { alignItems: 'center', backgroundColor: '#f2f3f9', borderRadius: 12, padding: 24, marginBottom: 16, borderColor: '#e1e2e8', borderWidth: 1 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: '#ffffff' },
  profileName: { fontSize: 28, fontWeight: 'bold', color: '#191c20', marginBottom: 4 },
  levelBadge: { backgroundColor: 'rgba(157,238,237,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  levelBadgeText: { color: '#0b6e6e', fontSize: 14, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#eceef3', borderRadius: 8, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#00497d', marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#414750', fontWeight: 'bold' },
  activityList: { backgroundColor: '#ffffff', borderRadius: 12, borderColor: '#e1e2e8', borderWidth: 1, overflow: 'hidden' },
  activityItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderColor: '#e1e2e8', alignItems: 'center' },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: 'bold', color: '#191c20' },
  activityMeta: { fontSize: 12, color: '#414750' },
  activityPoints: { alignItems: 'flex-end' },
  activitySaved: { fontSize: 12, color: '#006a6a', marginBottom: 2 },
  activityScore: { fontSize: 12, fontWeight: 'bold', color: '#00497d' },
  logoutButton: { backgroundColor: '#ffdad6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  logoutText: { color: '#93000a', fontWeight: 'bold', fontSize: 16 },
  
  input: { backgroundColor: '#f2f3f9', padding: 16, borderRadius: 8, marginBottom: 12, color: '#191c20', borderColor: '#e1e2e8', borderWidth: 1 },

  alertCardRed: { backgroundColor: '#ffdad6', borderRadius: 12, padding: 16, marginBottom: 12, borderColor: 'rgba(186, 26, 26, 0.2)', borderWidth: 1 },
  alertTitleRed: { fontSize: 16, fontWeight: 'bold', color: '#93000a' },
  alertDescRed: { fontSize: 14, color: '#93000a' },
  alertTime: { fontSize: 12, color: 'rgba(147, 0, 10, 0.8)', marginTop: 8 },
  notificationCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, borderColor: '#e1e2e8', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },

  tabBar: { flexDirection: 'row', backgroundColor: '#eceef3', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabButtonActive: { backgroundColor: '#9deeed', borderRadius: 20, marginHorizontal: 10 },
  tabText: { fontSize: 11, color: '#414750', marginTop: 4, fontWeight: '500' },
  tabTextActive: { color: '#0b6e6e', fontWeight: 'bold' }
});
