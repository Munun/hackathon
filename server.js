require("dotenv").config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

const { schema } = mongoose;


const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoose.disconnect();
  }
}
run().catch(console.dir);


// 1. User Profile Schema
const userProfileSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  demographics: {
    age_group: String,
    ethnicity: String,
    gender: String
  },
  medical_conditions: [String],
  current_medications: [String],
  health_metrics: {
    bmi: Number,
    blood_pressure: String,
    last_hba1c_level: Number
  },
  anonymized_at: {
    type: Date,
    default: Date.now
  },
  wallet_address: {
    type: String,
    required: true
  }
});


// 2. Trial Metadata Schema
const trialMetadataSchema = new mongoose.Schema({
  trial_id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  sponsor: String,
  eligibility_criteria: {
    min_age: Number,
    max_age: Number,
    required_conditions: [String],
    excluded_conditions: [String]
  },
  location: String,
  reward_amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'Recruiting', 'Closed'],
    default: 'Open'
  }
});


// 3. Match Schema
const matchSchema = new mongoose.Schema({
  match_id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  user_id: {
    type: String,
    required: true,
    ref: 'UserProfile'
  },
  trial_id: {
    type: String,
    required: true,
    ref: 'TrialMetadata'
  },
  match_score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  match_reasoning: String,
  enrollment_status: {
    type: String,
    enum: ['Pending', 'Matched', 'Consent_Signed', 'Rejected'],
    default: 'Pending'
  },
  solana_tx_sig: String
});

// Create models
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const TrialMetadata = mongoose.model('TrialMetadata', trialMetadataSchema);
const Match = mongoose.model('Match', matchSchema);

// Export the models
module.exports = { UserProfile, TrialMetadata, Match };