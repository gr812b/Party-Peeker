import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert, TextInput } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashlight, setFlashlight] = useState(false);
  const [torch, setTorch] = useState<'on' | 'off'>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [intervalMinutes, setIntervalMinutes] = useState<string>(''); // User input for interval in minutes
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null); // Interval ID for clearInterval
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!mediaPermission || !mediaPermission.granted) {
      requestMediaPermission();
    }
  }, [mediaPermission]);

  // Request media library permissions
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  if (!mediaPermission || !mediaPermission.granted) {
    // Media library permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to save photos to the gallery</Text>
        <Button onPress={requestMediaPermission} title="Grant Media Library Permission" />
      </View>
    );
  }

  const startCountdown = async () => {
    setTorch('on');
    //Alert.alert("Get Ready!", "The picture will be taken after a countdown.");

    // Slow flashing: Flash once per second for 5 seconds
    for (let i = 0; i < 5; i++) {
      toggleFlashlight();
      await delay(1000); // Wait for 1 second before toggling again
    }

    // Quick flashing: Flash every 200ms for 2 seconds (10 times)
    for (let i = 0; i < 10; i++) {
      toggleFlashlight();
      await delay(200); // Wait for 200ms before toggling again
    }

    setFlashlight(false); // Turn off flashlight after countdown

    // Take picture
    takePicture();
    setTorch('off');  
  };

  // Helper function to create a delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function takePicture() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        const asset = await MediaLibrary.createAssetAsync(photo?.uri ?? '');
        //Alert.alert('Photo Saved!', `Saved to ${asset.uri}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture: ' + (error as Error).message);
      }
    }
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlashlight = () => setFlashlight(current => !current);

  // Function to handle interval start/stop
  const handleIntervalToggle = () => {
    if (intervalId) {
      // If an interval is already set, clear it
      clearInterval(intervalId);
      setIntervalId(null);
      Alert.alert('Interval Stopped', 'Automatic picture taking has been stopped.');
    } else {
      // Start the interval if not already running
      const interval = 2; // Interval in minutes
      if (!isNaN(interval) && interval > 0) {
        const newIntervalId = setInterval(() => {
          // 1 in 15 chance to call startCountdown, otherwise call takePicture
          if (Math.random() < 1 / 15) {
            startCountdown();
          } else {
            takePicture();
          }
        }, interval * 60000); // Convert minutes to milliseconds
        setIntervalId(newIntervalId);
        Alert.alert('Interval Started', `Taking a picture every ${interval} minute(s), with a 1 in 15 chance to start countdown instead.`);
      } else {
        Alert.alert('Invalid Interval', 'Please enter a valid interval in minutes.');
      }
    }
  };
  

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        enableTorch={flashlight}
        flash={torch}
        ref={cameraRef}
      >
        <View style={styles.controlsContainer}>
          <View style={styles.intervalInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter interval in minutes"
              keyboardType="numeric"
              value={intervalMinutes}
              onChangeText={setIntervalMinutes}
            />
            <Button
              title={intervalId ? "Stop Interval" : "Start Interval"}
              onPress={handleIntervalToggle}
            />
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={startCountdown}>
              <Text style={styles.text}>Take Picture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  intervalInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginRight: 10,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  button: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
