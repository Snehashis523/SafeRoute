import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PlanScreen from './src/screens/Plan';
import RouteCompareScreen from './src/screens/RouteCompare';
import ActiveTripScreen from './src/screens/ActiveTrip';
import SOSScreen from './src/screens/SOS';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Plan">
        <Stack.Screen name="Plan" component={PlanScreen} />
        <Stack.Screen name="RouteCompare" component={RouteCompareScreen} />
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SOS" component={SOSScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
