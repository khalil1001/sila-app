# Sila - Transport App Setup Guide

A React Native Expo app connecting transporters between Tunisia and France with clients who need packages shipped.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator
- Supabase account

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React Navigation
- Supabase Client
- AsyncStorage
- Linear Gradient
- DateTimePicker
- URL Polyfill

### 2. Supabase Setup

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings > API

#### Update Supabase Configuration

Edit `lib/supabase.js` and replace the placeholders:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

#### Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('transporter', 'client')),
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create transport_offers table
CREATE TABLE transport_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transporter_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_coords JSONB NOT NULL,
  dropoff_location TEXT NOT NULL,
  dropoff_coords JSONB NOT NULL,
  departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_capacity_kg DECIMAL NOT NULL,
  available_capacity_kg DECIMAL NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('tn_fr', 'fr_tn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create transport_requests table
CREATE TABLE transport_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL NOT NULL,
  desired_date TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_coords JSONB NOT NULL,
  dropoff_location TEXT NOT NULL,
  dropoff_coords JSONB NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('tn_fr', 'fr_tn')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'matched', 'paid')),
  matched_offer_id UUID REFERENCES transport_offers ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for transport_offers
CREATE POLICY "Anyone can view transport offers" ON transport_offers
  FOR SELECT USING (true);

CREATE POLICY "Transporters can create offers" ON transport_offers
  FOR INSERT WITH CHECK (auth.uid() = transporter_id);

CREATE POLICY "Transporters can update their offers" ON transport_offers
  FOR UPDATE USING (auth.uid() = transporter_id);

CREATE POLICY "Transporters can delete their offers" ON transport_offers
  FOR DELETE USING (auth.uid() = transporter_id);

-- Create policies for transport_requests
CREATE POLICY "Users can view their own requests" ON transport_requests
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Transporters can view requests for their offers" ON transport_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transport_offers
      WHERE transport_offers.id = transport_requests.matched_offer_id
      AND transport_offers.transporter_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create requests" ON transport_requests
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their requests" ON transport_requests
  FOR UPDATE USING (auth.uid() = client_id);
```

## Running the App

### Start Development Server

```bash
npm start
# or
expo start
```

### Run on iOS Simulator

```bash
npm run ios
```

### Run on Android Emulator

```bash
npm run android
```

### Run on Web

```bash
npm run web
```

## App Structure

```
sila-app/
├── App.js                          # Main navigation setup
├── lib/
│   └── supabase.js                 # Supabase client configuration
├── screens/
│   ├── WelcomeScreen.js            # User type selection
│   ├── LoginScreen.js              # Email/OAuth login
│   ├── SignupScreen.js             # User registration
│   ├── TransporterDashboard.js     # Transporter's offers list
│   ├── ClientDashboard.js          # Client's requests list
│   ├── CreateOfferScreen.js        # Create transport offer
│   ├── MapSelectionScreen.js       # Mock map location picker
│   ├── ViewBookingsScreen.js       # View bookings for an offer
│   ├── NewRequestScreen.js         # Create transport request
│   ├── MatchFoundScreen.js         # Show matched transporter
│   └── PaymentScreen.js            # Mock payment processing
└── package.json
```

## Features

### For Transporters 🚚

1. **Create Transport Offers**
   - Set pickup and dropoff locations
   - Select departure and arrival dates/times
   - Specify available capacity
   - Choose direction (Tunisia → France or France → Tunisia)

2. **View Bookings**
   - See all clients who booked your transport
   - Access client contact information
   - Track booking status

3. **Manage Offers**
   - View all your transport offers
   - See booking counts
   - Monitor available capacity

### For Clients 📦

1. **Create Transport Requests**
   - Specify package weight
   - Set pickup and dropoff locations
   - Choose desired date/time
   - Automatic matching with available transporters

2. **View Matched Transporters**
   - See transporter details
   - View route and schedule
   - Check pricing

3. **Mock Payment**
   - Review transport summary
   - Confirm booking
   - Mark as paid (Stripe integration coming soon)

## User Flows

### Transporter Flow

1. Welcome Screen → Select "Transporteur" → Login/Signup
2. Transporter Dashboard → Create New Offer
3. Fill offer details → Select locations on map
4. Set dates/times → Create offer
5. View bookings → Contact clients

### Client Flow

1. Welcome Screen → Select "Client" → Login/Signup
2. Client Dashboard → New Request
3. Fill request details → Select locations on map
4. Find transporter → View matched offer
5. Confirm and pay → Payment complete

## Design Features

- **Purple gradient theme** (#667eea to #764ba2)
- **French language** throughout the app
- **Clean, minimal UI** with rounded cards
- **Shadow effects** on buttons and cards
- **Icon-based navigation** with emojis
- **Responsive layouts** for all screen sizes

## Mock Features

The following features are currently mocked for demonstration:

1. **OAuth Authentication** - Google and Facebook buttons show alerts
2. **Map Selection** - Touch-based coordinate selection with gradient background
3. **Payment Processing** - Mock payment with fixed €45 price
4. **Pricing** - Static pricing (Stripe integration planned)

## Database Schema

### profiles
- `id` - UUID (references auth.users)
- `email` - Text
- `user_type` - 'transporter' or 'client'
- `phone` - Text
- `created_at` - Timestamp

### transport_offers
- `id` - UUID
- `transporter_id` - UUID
- `pickup_location` - Text
- `pickup_coords` - JSONB {lat, lng}
- `dropoff_location` - Text
- `dropoff_coords` - JSONB {lat, lng}
- `departure_date` - Timestamp
- `arrival_date` - Timestamp
- `total_capacity_kg` - Decimal
- `available_capacity_kg` - Decimal
- `direction` - 'tn_fr' or 'fr_tn'
- `created_at` - Timestamp

### transport_requests
- `id` - UUID
- `client_id` - UUID
- `weight_kg` - Decimal
- `desired_date` - Timestamp
- `pickup_location` - Text
- `pickup_coords` - JSONB {lat, lng}
- `dropoff_location` - Text
- `dropoff_coords` - JSONB {lat, lng}
- `direction` - 'tn_fr' or 'fr_tn'
- `status` - 'pending', 'matched', or 'paid'
- `matched_offer_id` - UUID (references transport_offers)
- `created_at` - Timestamp

## Troubleshooting

### Common Issues

1. **"Command not found: expo"**
   - Install Expo CLI globally: `npm install -g expo-cli`

2. **Supabase connection errors**
   - Verify your URL and anon key in `lib/supabase.js`
   - Check that RLS policies are set up correctly

3. **Date picker not showing**
   - Make sure `@react-native-community/datetimepicker` is installed
   - Run `npm install` again if needed

4. **Navigation errors**
   - Clear Metro bundler cache: `expo start --clear`

## Next Steps

1. **Integrate real maps** - Replace mock map with Google Maps or Mapbox
2. **Add Stripe payment** - Replace mock payment with real Stripe integration
3. **Implement OAuth** - Set up Google and Facebook OAuth providers
4. **Add push notifications** - Notify users of bookings and matches
5. **Add real-time chat** - Enable transporter-client communication
6. **Implement rating system** - Allow users to rate transporters
7. **Add package tracking** - Track package status in real-time

## Support

For issues or questions, please check:
- Supabase documentation: https://supabase.com/docs
- Expo documentation: https://docs.expo.dev
- React Navigation: https://reactnavigation.org

## License

This project is for demonstration purposes.
