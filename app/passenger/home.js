import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications"
import { registerForPushNotificationsAsync } from "../../api/utils/notifications";
import { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../i18n";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import io from "socket.io-client";
import * as Linking from "expo-linking";
import { SafeAreaView} from "react-native-safe-area-context";
import LogoutButton from "../../components/logoutButton";
import * as Device from 'expo-device'

export default function PassengerHome() {
  const [name, setName] = useState("");
  const [driverInfo, setDriverInfo] = useState(null)
  const [drivers, setDrivers] = useState("");
  const [location, setLocation] = useState(null);
  const webViewRef = useRef(null);
  const locationSub = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId , setUserId] = useState(null);
  const [searching,setSearching] = useState(false)
  const [rideId , setRideId] = useState(null)
  const api_url = "https://ox-mvpp.onrender.com"
  const socketRef = useRef(null)
  const [rideStarted, setRideStarted] = useState(false)
const [bottomSheetVisible, setBottomSheetVisible] = useState(false)
  const handleRideRequest = async () => {
    if (!depart || !destination) {
      Alert.alert(`${i18n.t("error")} ${i18n.t("fillTheInputs")}`);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${api_url}/api/routes/rideRequest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            passengerId: userId,
            depart,
            destination,
            pickupLocation: {
              lat: location.latitude,
              lng: location.longitude,
            },
            //number
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        Alert.alert(`${i18n.t("requestFailed")}`);
        return;
      }
      setRideId(data.rideId)
      setSearching(true)
    } catch (error) {
      console.log(error);
      Alert.alert(`${i18n.t("networkErrorCannotConnectTheServer")}`);
    } finally {
      setLoading(false);
      setModalVisible(false);
      setDepart("");
      setDestination("");

    }
  };
  const handleHideSheet = () => {
  setBottomSheetVisible(false)
}
const handleCallDriver = (phone) => {
  Linking.openURL(`tel:${phone}`);
};
useEffect(()=>{
  const setupNotification = async () => {
  const token = await registerForPushNotificationsAsync()
  if(token && userId){
    await fetch(`${api_url}/api/users/save-push-token`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({
          userId,
          pushToken:token,
        })
      }
    )
  }
}
setupNotification()
},[userId])

  useEffect(() => {
    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setLocation({ latitude, longitude });

      const userId = await AsyncStorage.getItem("userId");
      setUserId(userId);
      if (!userId) return;

      ////////////////////

      await fetch(`${api_url}/api/passenger/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passengerId: userId,
          lat: latitude,
          lng: longitude,
        }),
      });
      await fetch(`${api_url}/api/driver/nearby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: latitude,
          lng: longitude,
        }),
      });
    };

    init();
  }, []);
  useEffect(()=>{
    const sub = Notifications.addNotificationReceivedListener((notification) =>{
      console.log("Notification received:",notification)
    }
  )
  return () => sub.remove()
  },[])
  useEffect(() => {
    if(!userId) return
    if(!socketRef.current){
         const socket = io(api_url);
         socketRef.current = socket
    socket.on("connect",()=>{
      socket.emit("passenger_online",userId)
    })
    }
    const socket = socketRef.current
    const handleRideAccepted = (data)=>{
      console.log("driver accepted: ",data)

      if(data.rideId === rideId){
        setSearching(false)
      setRideStarted(true)
      setBottomSheetVisible(true)
      setDriverInfo({
        phone: data.driverPhone
      })
      Alert.alert("driver found")
      }
    }
    const handleRideCompleted = (data) =>{
      console.log("ride completed: ",data)
      if(data.rideId === rideId){
      setRideStarted(false)
      setBottomSheetVisible(false)
      setRideId(null)
      Alert.alert("trip completed")

    }
  }
  socket.on("ride_accepted",handleRideAccepted)
  socket.on("ride_completed",handleRideCompleted)

   return () => {
    socket.off("ride_accepted",handleRideAccepted);
    socket.off("ride_completed",handleRideCompleted);
  };
}, [userId,rideId]);
  const handleCancelRide = ()=>{
    socketRef.current.emit("cancel_ride",{
      rideId,
    })
    setSearching(false)
    setRideId(null)
  }
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

        const passengerMarker = L.marker(
          [${location.latitude}, ${location.longitude}]
        ).addTo(map).bindPopup("You");

        window.updatePassengerLocation = (lat, lng) => {
          passengerMarker.setLatLng([lat, lng]);
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
      <LogoutButton/>
      {location && (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: mapHtml }}
          style={{ flex: 1 }}
        />
      )}
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.requestButtonText}>{i18n.t("requestRide")}</Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text
                style={{ fontSize: 20, color: "gray", fontWeight: "bold" }}
              >
                x
              </Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={i18n.t("departure")}
              value={depart}
              onChangeText={setDepart}
            />
            <TextInput
              style={styles.input}
              placeholder={i18n.t("destination")}
              value={destination}
              onChangeText={setDestination}
            />
            <TouchableOpacity
              style={[styles.okButton, , loading && { opacity: 0.7 }]}
              onPress={() => {
                handleRideRequest();
                console.log("Depart:", depart, "Destination:", destination);
              }}
            >
              {loading ? (
                <ActivityIndicator color={"white"} />
              ) : (
                <Text style={{ color: "white", fontWeight: "bold" }}>OK</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {searching && (
  <View style={styles.searchingOverlay}>
    <View style={styles.searchingBox}>
      <ActivityIndicator size="large" color="#1e90ff" />
      <Text style={styles.searchingText}>
        {i18n.t("searchingForDrivers")}
      </Text>
      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelRide}>
        <Text style={styles.btnText}>{i18n.t("cancel")}</Text>
      </TouchableOpacity>
      
    </View>

  </View>
)}
    {bottomSheetVisible && rideStarted && (
  <View style={styles.bottomSheet}>
    
    <TouchableOpacity
      style={styles.hideBtn}
      onPress={handleHideSheet}
    >
      <Text style={{fontWeight:"bold"}}>▼</Text>
    </TouchableOpacity>

    <Text style={styles.sheetTitle}>{i18n.t("driverOnTheWay")}</Text>

    <TouchableOpacity
      style={styles.callBtn}
      onPress={() => handleCallDriver(driverInfo?.phone)} // later dynamic
    >
      <Text style={styles.callText}>📞{i18n.t("callDriver")}</Text>
    </TouchableOpacity>

  </View>
)}

    </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Bottom Button
  requestButton: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "10%",
    backgroundColor: "#1e90ff",
    justifyContent: "center",
    alignItems: "center",
  },
  requestButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,

    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 20,
    color: "red",
  },
  input: {
    marginTop: 50,
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  okButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#1e90ff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  searchingOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},

searchingBox: {
  width: "80%",
  backgroundColor: "white",
  padding: 25,
  borderRadius: 12,
  alignItems: "center",
},

searchingText: {
  marginTop: 15,
  fontSize: 18,
  fontWeight: "bold",
},

searchingSubText: {
  marginTop: 5,
  color: "gray",
},
bottomSheet: {
  position: "absolute",
  bottom: 0,
  width: "100%",
  backgroundColor: "white",
  padding: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  alignItems: "center",
  elevation: 20
},

sheetTitle: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 10
},

callBtn: {
  backgroundColor: "#1e90ff",
  paddingVertical: 12,
  paddingHorizontal: 30,
  borderRadius: 10
},

callText: {
  color: "white",
  fontWeight: "bold",
  fontSize: 16
},

hideBtn: {
  position: "absolute",
  top: 10,
  right: 20
}

});
