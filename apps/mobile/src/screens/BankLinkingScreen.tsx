import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Search, ShieldCheck } from 'lucide-react-native';

const BANKS = [
  { id: '1', name: 'Nabil Bank', icon: '🏦', color: '#E31E24' },
  { id: '2', name: 'Global IME Bank', icon: '🏦', color: '#00529B' },
  { id: '3', name: 'NIC Asia Bank', icon: '🏦', color: '#D71920' },
  { id: '4', name: 'Nepal Investment Mega Bank', icon: '🏦', color: '#2B3990' },
  { id: '5', name: 'Prabhu Bank', icon: '🏦', color: '#ED1C24' },
  { id: '6', name: 'Siddhartha Bank', icon: '🏦', color: '#0072BC' },
];

export const BankLinkingScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View className="p-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">Link Bank Account</Text>
      </View>

      <View className="px-4 mb-6">
        <View className="bg-slate-800 p-4 rounded-2xl flex-row items-center">
          <Search color="#94A3B8" size={20} />
          <Text className="text-slate-400 ml-3">Search your bank...</Text>
        </View>
      </View>

      <View className="px-4 mb-4">
        <Text className="text-slate-400 font-semibold mb-3">POPULAR BANKS</Text>
        <FlatList
          data={BANKS}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className="flex-1 bg-slate-900 m-1 p-4 rounded-2xl items-center border border-slate-800"
              onPress={() => alert(`Redirecting to ${item.name} Secure Portal...`)}
            >
              <Text style={{ fontSize: 32 }}>{item.icon}</Text>
              <Text className="text-white text-xs text-center mt-2 font-medium" numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View className="mt-auto p-6 bg-slate-900 rounded-t-3xl border-t border-slate-800">
        <View className="flex-row items-center mb-4">
          <ShieldCheck color="#00D09C" size={24} />
          <Text className="text-white font-bold ml-3">Secure Bank Link</Text>
        </View>
        <Text className="text-slate-400 text-sm leading-5">
          Batuwa uses industry-standard encryption. We never store your bank login credentials or transaction PIN.
        </Text>
        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-2xl items-center mt-6"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-bold text-lg">Continue to Secure Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
});
