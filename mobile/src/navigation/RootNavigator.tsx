import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import GamesScreen from '../screens/GamesScreen';
import ListsScreen from '../screens/ListsScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import StartSessionScreen from '../screens/StartSessionScreen';
import JoinSessionScreen from '../screens/JoinSessionScreen';
import LobbyScreen from '../screens/LobbyScreen';
import VotingScreen from '../screens/VotingScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerStyle: { backgroundColor: '#6750A4' }, headerTintColor: '#fff' }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'GamePicker' }} />
        <Stack.Screen name="Games" component={GamesScreen} options={{ title: 'My Games' }} />
        <Stack.Screen name="Lists" component={ListsScreen} options={{ title: 'My Lists' }} />
        <Stack.Screen
          name="ListDetail"
          component={ListDetailScreen}
          options={({ route }) => ({ title: route.params.listName })}
        />
        <Stack.Screen name="StartSession" component={StartSessionScreen} options={{ title: 'Start a Vote' }} />
        <Stack.Screen name="JoinSession" component={JoinSessionScreen} options={{ title: 'Join a Vote' }} />
        <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Lobby', headerBackVisible: false }} />
        <Stack.Screen name="Voting" component={VotingScreen} options={{ title: 'Vote!', headerBackVisible: false }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
