import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { TabNavigator } from './TabNavigator';
import { WebTabNavigator } from './WebTabNavigator';
import { THEME } from '../theme/theme';
import { useAuthStore } from '../store/useAuthStore';

// Screens
import LoginScreen from '../screens/auth/LoginScreen'; 
import SetupPinScreen from '../screens/auth/SetupPinScreen';
import BillInquiryScreen from '../screens/payments/BillInquiryScreen';
import BillConfirmScreen from '../screens/payments/BillConfirmScreen';
import PaymentSuccessScreen from '../screens/payments/PaymentSuccessScreen';
import TransferMoneyScreen from '../screens/payments/TransferMoneyScreen';
import KycSubmissionScreen from '../screens/kyc/KycSubmissionScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import FamilyManagementScreen from '../screens/FamilyManagementScreen';
import MerchantPaymentScreen from '../screens/payments/MerchantPaymentScreen';
import AiInsightsScreen from '../screens/AiInsightsScreen';
import { BankLinkingScreen } from '../screens/BankLinkingScreen';

const Stack = createNativeStackNavigator();


export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: THEME.colors.background },
        headerTintColor: THEME.colors.textPrimary,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: THEME.colors.background },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={Platform.OS === 'web' ? WebTabNavigator : TabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen name="SetupPin" component={SetupPinScreen} options={{ headerShown: false }} />
          <Stack.Screen 
            name="BillInquiry" 
            component={BillInquiryScreen} 
            options={{ headerShown: true, title: 'Inquiry' }} 
          />
          <Stack.Screen 
            name="BillConfirm" 
            component={BillConfirmScreen} 
            options={{ headerShown: true, title: 'Confirm Payment' }} 
          />
          <Stack.Screen 
            name="TransferMoney" 
            component={TransferMoneyScreen} 
            options={{ headerShown: true, title: 'Send Money' }} 
          />
          <Stack.Screen 
            name="KycSubmission" 
            component={KycSubmissionScreen} 
            options={{ headerShown: true, title: 'Verify Identity' }} 
          />
          <Stack.Screen 
            name="FamilyManagement" 
            component={FamilyManagementScreen} 
            options={{ headerShown: true, title: 'Family Batuwa' }} 
          />
          <Stack.Screen 
            name="MerchantPayment" 
            component={MerchantPaymentScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="AiInsights" 
            component={AiInsightsScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="BankLinking" 
            component={BankLinkingScreen} 
            options={{ headerShown: true, title: 'Link Bank Account' }} 
          />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />

        </>
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
