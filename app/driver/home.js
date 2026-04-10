import {
  ActivityIndicator,
  View,
  Text,
  Switch,
  Alert,
  StyleSheet,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import i18n from "../../i18n";
import io from "socket.io-client";
import { Modal } from "react-native";
import {Audio} from "expo-av"
import { TouchableOpacity } from "react-native";
import * as Linking from "expo-linking"
import { SafeAreaView} from "react-native-safe-area-context";
import Constants from "expo-constants"
import * as Notifications from "expo-notifications" 
import * as Device from "expo-device"



export default function DriverScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [location, setLocation] = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeRide,setActiveRide] = useState(null)
  const [countDown,setCountdown] = useState(15)
  const timerRef = useRef(null)
  const socketRef = useRef(null);
  const isHandlingRide = useRef(false)

  const webViewRef = useRef(null);
  const locationSub = useRef(null);
  const soundRef = useRef(null);
  const api_url = "https://ox-mvpp.onrender.com"

  console.log("is Device = ",Device.isDevice)
  Notifications.setNotificationHandler({
    handleNotification:async ()=>({
      shouldShowAlert:true,
      shouldPlaySound:true,
      shouldSetBadge:false,
    })
  })
  const registerForPushNotificationsAsync = async ()=>{
    console.log("the func is started")
    console.log("out try is device ",Device.isDevice)
    try{
      if(!Device.isDevice){
        console.log("must be a real device")
            console.log("in if try is device ",Device.isDevice)

        return
      }
          console.log("checking permissioon")
  

    const {status:existingStatus} = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if(existingStatus !== 'granted'){
                console.log("req permissioon")

      const {status} = await Notifications.requestPermissionsAsync()
      console.log("existing st ",existingStatus)
        finalStatus = status
    
    if(finalStatus !== 'granted'){
      console.log("permission not granted")
      return
    }
              console.log("generating p t")


    const tokenData = await Notifications.getExpoPushTokenAsync({projectId:Constants.expoConfig?.extra?.eas?.projectId,})
              console.log("token ",tokenData)

    const token = tokenData.data
    console.log("driver push token: ",token)
    const userId = await AsyncStorage.getItem('userId')
    console.log("userId ",userId)
    if(!userId || !token){ 
      console.log("missing userid or token")
      return
    }
    console.log("sending push token")
    console.log("userid ",userId)
    console.log("token ",token)
    const res = await fetch(`${api_url}/api/users/save-push-token`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        userId:userId,
        pushToken:token
      }),
    });
    console.log("req sent waiting res")
    const data = await res.json()
    console.log("backend response ",data)
    return token
    }
    }catch(err){
      console.log("push notification error ",err)
    }
  }
useEffect(()=>{
  registerForPushNotificationsAsync()
},[])
useEffect(()=>{
  const sub = Notifications.addNotificationReceivedListener(notification =>{
    console.log("Driver received push ",notification)
  })
  return ()=> sub.remove()
},[])
useEffect(()=>{
  Audio.setAudioModeAsync({
    playsInSilentModeIOS:true,
    staysActiveInBackground:false,
  })
},[])
const playNotificationSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/soundEffect/not.mp3"),
      { shouldPlay: true }
    );

    soundRef.current = sound;

    await sound.playAsync();
  } catch (error) {
    console.log("Error playing sound:", error);
  }
};

  

  const startTimer = () => {
  setCountdown(10);

  timerRef.current = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(timerRef.current);
        handleTimeout();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
const handleTimeout = () => {
  console.log("Ride request timed out");

  setModalVisible(false);
  isHandlingRide.current = false;

  // Optional: notify server
  socketRef.current?.emit("ride_timeout", {
    rideId: incomingRide?.rideId,
    userId: userId,
  });
};

 /* ---------------------------
     SOUND REF
  ---------------------------- */
useEffect(() => {
  return () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
  };
}, []);


  /* ---------------------------
     LOAD DRIVER ID
  ---------------------------- */
  useEffect(() => {
    const loadUser = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;
      setUserId(userId);
    };
    loadUser();
  }, []);

   /* ---------------------------
     THE SOCKET ON
  ---------------------------- */
  useEffect(() => {
    if (!userId) return;

    const socket = io(api_url);
    socketRef.current = socket;

    if (isOnline) {
      socket.emit("driver_online", userId);
    }

    socket.on("new_ride_request", (rideData) => {
    if(isHandlingRide.current){
    console.log("is busy withe the ride")
    return;
    }
      console.log("new ride received:", rideData);
      isHandlingRide.current = true;
      setIncomingRide(rideData);
      setModalVisible(true);
      playNotificationSound();
      startTimer()
    });
    socket.on("ride_confirmed",(data)=>{
      console.log("Trip started:",data)
      setActiveRide({
        rideId:data.rideId,
        passengerPhone:data.passengerPhone,
        pickupLocation:data.pickupLocation
      })
    })
    socket.on("ride_cancelled",({rideId})=>{
      if(incomingRide?.rideId === rideId){
        setModalVisible(false)
        isHandlingRide.current = false
        clearInterval(timerRef.current)
      }
    })
    return () => {
      socket.off("new_ride_request");
    };
  }, [userId, isOnline]); //Driver

  /* ---------------------------
     START LIVE LOCATION
  ---------------------------- */
  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission required");
      return false;
    }

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (loc) => {
        const coords = loc.coords;
        setLocation(coords);

        // Update marker in map
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.updateDriverLocation(${coords.latitude}, ${coords.longitude});
            true;
          `);
        }

        // Send location to backend
        fetch(`${api_url}/api/driver/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            lat: coords.latitude,
            lng: coords.longitude,
          }),
        }).catch(() => {});
      },
    );

    return true;
  };
  const handleReject = ()=>{
  clearInterval(timerRef.current);
  socketRef.current?.emit("ride_rejected", {
    rideId: incomingRide?.rideId,
    userId: userId,
  });
  setModalVisible(false)
  isHandlingRide.current = false;
  }
  /* ---------------------------
     STOP LIVE LOCATION
  ---------------------------- */
  const stopTracking = () => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
  };

  /* ---------------------------
     TOGGLE ONLINE / OFFLINE
  ---------------------------- */
  const toggleStatus = async (value) => {
    console.log("Sending status:", {
      userId: userId,
      isOnline: value,
    });
    if (!userId) {
      Alert.alert("Driver ID not loaded");
      return;
    }

    setLoading(true);

    try {
      if (value) {
        const started = await startTracking();
        if (!started) {
          setLoading(false);
          return;
        }
      } else {
        stopTracking();
      }

      await fetch(`${api_url}/api/driver/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          isOnline: value,
        }),
      });

      setIsOnline(value);
      if (value && socketRef.current) {
        socketRef.current.emit("driver_online", userId);
      }
    } catch (e) {
      Alert.alert("Network error");
      Alert.alert("Network error", e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     MAP HTML
  ---------------------------- */
  const mapHtml = location
    ? `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div id="map"></div>

      <script>
        const map = L.map("map").setView(
          [${location.latitude}, ${location.longitude}],
          16
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        const driverMarker = L.marker(
          [${location.latitude}, ${location.longitude}]
        ).addTo(map).bindPopup("You");

        window.updateDriverLocation = (lat, lng) => {
          driverMarker.setLatLng([lat, lng]);
          map.setView([lat, lng]);
        };
      </script>
    </body>
  </html>
  `
    : null;

  return (
    <SafeAreaView style={{flex:1}}>
         <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t("driverMode")}</Text>

        <Switch
          value={isOnline}
          onValueChange={toggleStatus}
          disabled={loading || !userId}
        />

        <Text>
          {i18n.t("status")}:{" "}
          {isOnline ? `${i18n.t("online")}` : `${i18n.t("offline")}`}
        </Text>
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5c5c5cff" />
          <Text style={styles.loadingText}>
            {isOnline ? `${i18n.t("loading")}` : `${i18n.t("loading")}`}
          </Text>
        </View>
      )}

      {location && (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
        />
      )}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🚕 {i18n.t("newRideRequest")}</Text>

            <View style={styles.rideInfoContainer}>
              <Text style={styles.rideText}>
                {i18n.t("departure")}: {incomingRide?.pickup?.name}
              </Text>

              <Text style={styles.rideText}>
                {i18n.t("destination")}: {incomingRide?.destination?.name}
              </Text>
            </View>

            <View style={styles.modalButtons}>
            {/*ACCEPT BUTTON*/}
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => {
                    clearInterval(timerRef.current);
                  socketRef.current.emit("accept_ride", {
                    rideId: incomingRide.rideId,
                    userId: userId,
                  });
                  setModalVisible(false);
                }}
              >
                <Text style={styles.btnText}>{i18n.t("accept")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => 
                  
                  
                handleReject()}
              >
                <Text style={styles.btnText}>{i18n.t("reject")}</Text>
              </TouchableOpacity>
            </View>
              <Text style={{ textAlign: "center", marginBottom: 5,marginTop: 15, fontSize: 16,color: countDown <= 5 ? "red" : "black" }}> ⏳ {countDown}s</Text>
          </View>
        </View>
      </Modal>
      {activeRide && (
        <View style={styles.tripOverlay}>
          <Text style={styles.tripTitle}>{i18n.t("passenger")}</Text>
          <Text>{activeRide.passengerPhone}</Text>
          <TouchableOpacity
          style={styles.callBtn}
          onPress={()=>
            Linking.openURL(`tel:${activeRide.passengerPhone}`)

          }
          >
            <Text style={styles.btnText}>{i18n.t("call")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn} onPress={()=>{
            const [lat,lng] = activeRide.pickupLocation.location.coordinates;
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${lng},${lat}`
            )
          }}>
            <Text>{i18n.t("navigate")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeBtn} onPress={()=>{
            socketRef.current.emit("ride_completed",{
              rideId:activeRide.rideId,
              userId: userId
            })
            setActiveRide(null)
            isHandlingRide.current = false

          }}>
            <Text style={styles.btnText}>{i18n.t("rideCompleted")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View> 
    </SafeAreaView>

  );
}


/* ---------------------------
   STYLES
---------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 16,
    backgroundColor: "white",
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    paddingTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // dark transparent background
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 10, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  rideInfoContainer: {
    marginBottom: 25,
  },

  rideText: {
    fontSize: 16,
    marginBottom: 10,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  acceptBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },

  rejectBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },

  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  tripOverlay: {
  position: "absolute",
  bottom: 0,
  width: "100%",
  backgroundColor: "white",
  padding: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  elevation: 10
},

tripTitle: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 10
},

callBtn: {
  backgroundColor: "#27ae60",
  padding: 15,
  borderRadius: 10,
  marginTop: 10,
  alignItems: "center"
},

mapBtn: {
  backgroundColor: "#d1d6daff",
  padding: 15,
  borderRadius: 10,
  marginTop: 10,
  alignItems: "center"
},

completeBtn: {
  backgroundColor: "#e67e22",
  padding: 15,
  borderRadius: 10,
  marginTop: 10,
  alignItems: "center"
},
});
