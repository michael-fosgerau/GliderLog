import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Constants, Location, Permissions, Accelerometer, Gyroscope, ScreenOrientation, Magnetometer } from 'expo';

export default class MultiSensor extends React.Component {
  state = {
    gyroscopeData: { "gx":0, "gy": 0, "gz": 0 },
    accelerometerData: { "ax":0, "ay": 0, "az": 0 },
    rotationData: { "yaw":0, "pitch": 0, "roll": 0, "yawRate":0, "pitchRate": 0, "rollRate": 0 },
    orientationData: { "orientation": 0 },
    magnetometerData: { "mx":0, "my":0, "mz":0 },
    locationData: null,
    errorMessage: null
  }

  componentWillMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      this._getLocationAsync();
    }
  }

  componentDidMount() {
    // Lock screen orientation to Portrait to avoid distortion on reorientation
    ScreenOrientation.allow(ScreenOrientation.Orientation.PORTRAIT_UP); // Lock to "0"
    this._toggle();
    this._slow();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        "errorMessage": 'Permission to access location was denied',
      });
    }

    let locationData = await Location.getCurrentPositionAsync({});
    //console.log(locationData);
    this.setState({ "locationData": locationData });
  };

  _toggle = () => {
    if (this._subscription1) {
      this._unsubscribe();
    } else {
      this._subscribe();
    }
  }

  _slow = () => {
    Gyroscope.setUpdateInterval(1000);
    Accelerometer.setUpdateInterval(1000);
    Expo.DangerZone.DeviceMotion.setUpdateInterval(1000);
    Magnetometer.setUpdateInterval(1000);
  }

  _fast = () => {
    Gyroscope.setUpdateInterval(50);
    Accelerometer.setUpdateInterval(50);
    Expo.DangerZone.DeviceMotion.setUpdateInterval(50);
    Magnetometer.setUpdateInterval(50);
  }

  _subscribe = () => {
    this._subscription0 = Magnetometer.addListener((result) => {
      this.state.magnetometerData.mx = result.x;
      this.state.magnetometerData.my = result.y;
      this.state.magnetometerData.mz = result.z;
      this.setState({"magnetometerData": this.state.magnetometerData});
    });
    this._subscription1 = Gyroscope.addListener((result) => {
      this.state.gyroscopeData.gx = result.x;
      this.state.gyroscopeData.gy = result.y;
      this.state.gyroscopeData.gz = result.z;
      this.setState({ "gyroscopeData": this.state.gyroscopeData });
      //console.log('gyro', result.x, result.y, result.z);
    });
    this._subscription2 = Accelerometer.addListener(result => {
      this.state.accelerometerData.ax = result.x;
      this.state.accelerometerData.ay = result.y;
      this.state.accelerometerData.az = result.z;
      this.setState({ "accelerometerData": this.state.accelerometerData });
      //console.log('accl', result.x, result.y, result.z);
    });
    this._subscription3 = Expo.DangerZone.DeviceMotion.addListener((result) => {
      yaw = result.rotation.alpha;
      pitch = result.rotation.beta;
      roll = result.rotation.gamma;
      yawRate = result.rotationRate.alpha;
      pitchRate = result.rotationRate.beta;
      rollRate = result.rotationRate.gamma;
      this.setState({
        "rotationData": {
          "yaw": yaw, "pitch": pitch, "roll": roll,
          "yawRate": yawRate, "pitchRate": pitchRate, "rollRate": rollRate
        },
        "orientationData": {
          "orientation": result.orientation // Should always be 0 (locked orientation)
        }
      });
      this._getLocationAsync();
    })
  }

  _unsubscribe = () => {
    this._subscription0 && this._subscription0.remove();
    this._subscription0 = null;
    this._subscription1 && this._subscription1.remove();
    this._subscription1 = null;
    this._subscription2 && this._subscription2.remove();
    this._subscription2 = null;
    this._subscription3 && this._subscription3.remove();
    this._subscription3 = null;
  }

  render() {
    let { mx, my, mz } = this.state.magnetometerData;
    let { ax, ay, az } = this.state.accelerometerData;
    let { gx, gy, gz }  = this.state.gyroscopeData;
    let { yaw, pitch, roll, yawRate, pitchRate, rollRate }  = this.state.rotationData;
    let { orientation }  = this.state.orientationData;

    let errorMessage = 'Waiting for GPS signal...';
    let locationAccuracy = "n/a";
    let locationAltitude = "n/a";
    let locationHeading = "n/a";
    let locationLat = "n/a";
    let locationLng = "n/a";
    let locationSpeed = "n/a";
    if (this.state.errorMessage) {
      errorMessage = "Error: " + this.state.errorMessage;
    } else if (this.state.locationData) {
      errorMessage = "";
      locationAccuracy = round(this.state.locationData.coords.accuracy, 100);
      locationAltitude = round(this.state.locationData.coords.altitude, 1000) + " m";
      locationHeading = round(this.state.locationData.coords.heading, 100);
      locationLat = this.state.locationData.coords.latitude;
      locationLng = this.state.locationData.coords.longitude;
      locationSpeed = this.state.locationData.coords.speed + " km/h";
      /*Object {
[13:20:10]   "coords": Object {
[13:20:10]     "accuracy": 18.95599937438965,
[13:20:10]     "altitude": 113.4000015258789,
[13:20:10]     "heading": 0,
[13:20:10]     "latitude": 55.6845001,
[13:20:10]     "longitude": 9.5745172,
[13:20:10]     "speed": 0,
[13:20:10]   },
[13:20:10]   "mocked": false,
[13:20:10]   "timestamp": 1537269622443,
[13:20:10] }*/
    }

    return (
      <View style={styles.sensor}>
        <View style={styles.sensorValues}>
          <Text style={styles.titleText}>Magnetometer:</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.textLabel, styles.titleLabel]}>x-axis</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>y-axis</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>z-axis</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>{round(mx)}</Text>
            <Text style={styles.textLabel}>{round(my)}</Text>
            <Text style={styles.textLabel}>{round(mz)}</Text>
          </View>
          <Text style={styles.titleText}>Accelerometer:</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.textLabel, styles.titleLabel]}>x-axis</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>y-axis</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>z-axis</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>{round(ax)}</Text>
            <Text style={styles.textLabel}>{round(ay)}</Text>
            <Text style={styles.textLabel}>{round(az)}</Text>
          </View>
          <Text style={styles.titleText}>Gyroscope:</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.textLabel, styles.titleLabel]}>x-axis</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>y-axis</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>z-axis</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>{round(gx)}</Text>
            <Text style={styles.textLabel}>{round(gy)}</Text>
            <Text style={styles.textLabel}>{round(gz)}</Text>
          </View>
          <Text style={styles.titleText}>Rotation:</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.textLabel, styles.titleLabel]}>yaw (rate)</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>pitch (rate)</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>roll (rate)</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>{round(yaw)}</Text>
            <Text style={styles.textLabel}>{round(pitch)}</Text>
            <Text style={styles.textLabel}>{round(roll)}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>{round(yawRate)}</Text>
            <Text style={styles.textLabel}>{round(pitchRate)}</Text>
            <Text style={styles.textLabel}>{round(rollRate)}</Text>
          </View>
          <Text style={styles.titleText}>Location:</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.textLabel, styles.titleLabel]}>Accuracy</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>Speed</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>Heading</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>{locationAccuracy}</Text>
            <Text style={styles.textLabel}>{locationSpeed}</Text>
            <Text style={styles.textLabel}>{locationHeading}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.textLabel, styles.titleLabel]}>Altitude</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>Lat</Text>
            <Text style={[styles.textLabel, styles.titleLabel]}>Lng</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>{locationAltitude}</Text>
            <Text style={styles.textLabel}>{locationLat}</Text>
            <Text style={styles.textLabel}>{locationLng}</Text>
          </View>
          <Text style={styles.titleText}>Orientation:</Text>
          <View style={styles.textContainer}>
            <Text style={styles.textLabel}>{orientation}</Text>
          </View>
          <Text style={styles.textLabel}>{errorMessage}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this._toggle} style={styles.button}>
            <Text>Toggle</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._slow} style={[styles.button, styles.middleButton]}>
            <Text>Slow</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this._fast} style={styles.button}>
            <Text>Fast</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

  }
}

function round(n, digits=10000) {
  return (!n) ? 0.0 : Math.floor(n * digits) / digits;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sensorValues: {
    flex: 5
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#fff",
  },
  titleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: "#fff",
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 0,
    flex: 1
  },
  textLabel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 15,
    flex: 1
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 10,
  },
  middleButton: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  sensor: {
    marginTop: 0,
    paddingTop: 65,
    paddingHorizontal: 10,
    backgroundColor: "#000",
    flex: 1
  },
  paragraph: {

  }
});