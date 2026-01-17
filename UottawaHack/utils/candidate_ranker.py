"""
Candidate Selection Engine
Finds qualified candidates for clinical trials without bias-inducing rankings
Returns 1.5x required candidates who meet eligibility criteria
"""

import google.generativeai as genai
import json
import os
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from dotenv import load_dotenv
import asyncio
import random

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
MODEL_ID = 'gemini-2.0-flash'


@dataclass
class EligibleCandidate:
    """Represents an eligible candidate for a trial (unranked)"""
    patient_id: str
    eligibility_status: str  # "Fully Eligible", "Likely Eligible", "Conditionally Eligible"
    meets_inclusion: List[str]  # Inclusion criteria met
    meets_exclusion: bool  # True = passes exclusion criteria (not excluded)
    qualifying_factors: List[str]
    pending_verification: List[str]  # Data points that need verification
    confidence: float  # 0.0-1.0


@dataclass
class TrialCandidatePool:
    """Pool of eligible candidates for a single trial (unranked)"""
    trial_id: str
    trial_name: str
    condition: str
    required_candidates: int
    candidates_in_pool: int  # 1.5x required, capped at available
    eligible_candidates: List[EligibleCandidate]  # Unordered pool
    processing_stats: Dict


class CandidateSelector:
    """
    Selects eligible candidates for clinical trials without ranking.
    Returns a pool of 1.5x required candidates who meet eligibility criteria.
    Candidates are NOT ranked or ordered to avoid selection bias.
    """
    
    # Batch size for parallel processing
    BATCH_SIZE = 10
    
    # Minimum eligibility score to be included in pool
    ELIGIBILITY_THRESHOLD = 50
    
    @staticmethod
    async def select_candidates_for_trial(
        patients: List[Dict],
        trial: Dict,
        required_candidates: int = 10,
        multiplier: float = 1.5
    ) -> TrialCandidatePool:
        """
        Select eligible candidates for a single clinical trial.
        Returns an UNRANKED pool of qualified candidates.
        
        Args:
            patients: List of patient data dictionaries
            trial: Clinical trial information
            required_candidates: Number of candidates needed for the trial
            multiplier: Multiplier for pool size (default 1.5x)
            
        Returns:
            TrialCandidatePool with unranked eligible candidates
        """
        target_pool_size = int(required_candidates * multiplier)
        
        # Evaluate all patients for eligibility
        evaluated_patients = await CandidateSelector._batch_evaluate_patients(patients, trial)
        
        # Filter to only eligible candidates (score >= threshold)
        eligible_patients = [
            p for p in evaluated_patients 
            if p['eligibility_score'] >= CandidateSelector.ELIGIBILITY_THRESHOLD
        ]
        
        # If we have more eligible than needed, randomly select to avoid bias
        if len(eligible_patients) > target_pool_size:
            # Shuffle to remove any ordering bias, then take the pool size needed
            random.shuffle(eligible_patients)
            selected_patients = eligible_patients[:target_pool_size]
        else:
            selected_patients = eligible_patients
        
        # Shuffle final list again to ensure no implicit ordering
        random.shuffle(selected_patients)
        
        # Convert to EligibleCandidate objects (no rank assigned)
        eligible_candidates = []
        for candidate in selected_patients:
            eligible_candidates.append(EligibleCandidate(
                patient_id=candidate['patient_id'],
                eligibility_status=candidate['eligibility_status'],
                meets_inclusion=candidate['meets_inclusion'],
                meets_exclusion=candidate['meets_exclusion'],
                qualifying_factors=candidate['qualifying_factors'],
                pending_verification=candidate.get('pending_verification', []),
                confidence=candidate['confidence']
            ))
        
        return TrialCandidatePool(
            trial_id=trial['id'],
            trial_name=trial['name'],
            condition=trial.get('condition', 'Unknown'),
            required_candidates=required_candidates,
            candidates_in_pool=len(eligible_candidates),
            eligible_candidates=eligible_candidates,
            processing_stats={
                'total_patients_evaluated': len(patients),
                'eligible_candidates_found': len(eligible_patients),
                'target_pool_size': target_pool_size,
                'pool_size_returned': len(eligible_candidates)
            }
        )
    
    @staticmethod
    async def select_candidates_for_all_trials(
        patients: List[Dict],
        trials: List[Dict],
        required_candidates_per_trial: Dict[str, int] = None,
        default_required: int = 10,
        multiplier: float = 1.5
    ) -> Dict[str, TrialCandidatePool]:
        """
        Select eligible candidates for all clinical trials.
        Returns UNRANKED pools for each trial.
        
        Args:
            patients: List of patient data dictionaries
            trials: List of clinical trial objects
            required_candidates_per_trial: Dict mapping trial_id to required count
            default_required: Default candidates needed if not specified
            multiplier: Multiplier for pool size (default 1.5x)
            
        Returns:
            Dict mapping trial_id to TrialCandidatePool
        """
        if required_candidates_per_trial is None:
            required_candidates_per_trial = {}
        
        results = {}
        
        # Process each trial
        for trial in trials:
            trial_id = trial['id']
            required = required_candidates_per_trial.get(trial_id, default_required)
            
            print(f"Selecting candidates for trial: {trial['name']}...")
            
            result = await CandidateSelector.select_candidates_for_trial(
                patients=patients,
                trial=trial,
                required_candidates=required,
                multiplier=multiplier
            )
            results[trial_id] = result
            
            print(f"  → Found {result.candidates_in_pool} eligible candidates "
                  f"(target pool: {int(required * multiplier)})")
        
        return results
    
    @staticmethod
    async def _batch_evaluate_patients(patients: List[Dict], trial: Dict) -> List[Dict]:
        """
        Evaluate patients in batches for eligibility.
        
        Args:
            patients: List of patient data
            trial: Trial to evaluate against
            
        Returns:
            List of evaluated patient dictionaries
        """
        all_evaluations = []
        
        # Process in batches to avoid rate limits and manage context size
        for i in range(0, len(patients), CandidateSelector.BATCH_SIZE):
            batch = patients[i:i + CandidateSelector.BATCH_SIZE]
            batch_evaluations = await CandidateSelector._evaluate_patient_batch(batch, trial)
            all_evaluations.extend(batch_evaluations)
        
        return all_evaluations
    
    @staticmethod
    async def _evaluate_patient_batch(patients: List[Dict], trial: Dict) -> List[Dict]:
        """
        Evaluate a batch of patients for trial eligibility using Gemini.
        
        Args:
            patients: Batch of patient data (max BATCH_SIZE)
            trial: Trial to evaluate against
            
        Returns:
            List of evaluated patient dictionaries
        """
        # Add patient IDs if not present
        for idx, patient in enumerate(patients):
            if 'patient_id' not in patient:
                patient['patient_id'] = patient.get('name', f'Patient_{idx}')
        
        evaluation_prompt = f"""You are a clinical trial eligibility specialist. Evaluate each patient's eligibility for this trial.

CLINICAL TRIAL:
{json.dumps(trial, indent=2)}

PATIENTS TO EVALUATE:
{json.dumps(patients, indent=2)}

For EACH patient, evaluate their eligibility and return a JSON array.
DO NOT rank or order patients by preference - simply evaluate if they meet criteria.

Return ONLY valid JSON (no markdown, no code blocks):
[
    {{
        "patient_id": "exact patient name/id from input",
        "eligibility_score": 0-100,
        "eligibility_status": "Fully Eligible" | "Likely Eligible" | "Conditionally Eligible" | "Not Eligible",
        "meets_inclusion": ["list of inclusion criteria this patient meets"],
        "meets_exclusion": true/false (true means patient is NOT excluded - passes exclusion check),
        "qualifying_factors": ["specific factors that qualify this patient"],
        "pending_verification": ["data points that need verification before final determination"],
        "confidence": 0.0-1.0,
        "notes": "brief eligibility assessment"
    }}
]

ELIGIBILITY SCORING (for filtering purposes only, not ranking):
- 90-100: Fully Eligible - Meets ALL inclusion criteria, clearly passes all exclusion criteria
- 70-89: Likely Eligible - Meets most criteria, minor data gaps
- 50-69: Conditionally Eligible - May qualify pending additional information/verification
- 0-49: Not Eligible - Does not meet key criteria or fails exclusion criteria

IMPORTANT:
- Evaluate based on AVAILABLE data only
- Note any missing data in pending_verification
- Be thorough but objective - no comparative judgments between patients
- Return results for ALL {len(patients)} patients
"""

        try:
            model = genai.GenerativeModel(MODEL_ID)
            response = model.generate_content(
                evaluation_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for consistent evaluation
                    top_p=0.8,
                )
            )
            
            # Clean response
            response_text = response.text.strip()
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            evaluations = json.loads(response_text)
            
            # Validate all patients are evaluated
            if len(evaluations) != len(patients):
                print(f"Warning: Expected {len(patients)} evaluations, got {len(evaluations)}")
            
            return evaluations
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error in batch evaluation: {e}")
            # Return default evaluations for all patients in batch
            return [
                {
                    'patient_id': p.get('patient_id', f'Patient_{i}'),
                    'eligibility_score': 0,
                    'eligibility_status': 'Not Eligible',
                    'meets_inclusion': [],
                    'meets_exclusion': False,
                    'qualifying_factors': [],
                    'pending_verification': ['Evaluation error - manual review required'],
                    'confidence': 0.0,
                    'notes': 'Failed to evaluate due to processing error'
                }
                for i, p in enumerate(patients)
            ]
        except Exception as e:
            print(f"Batch evaluation error: {e}")
            return [
                {
                    'patient_id': p.get('patient_id', f'Patient_{i}'),
                    'eligibility_score': 0,
                    'eligibility_status': 'Not Eligible',
                    'meets_inclusion': [],
                    'meets_exclusion': False,
                    'qualifying_factors': [],
                    'pending_verification': [str(e)],
                    'confidence': 0.0,
                    'notes': f'Error: {str(e)}'
                }
                for i, p in enumerate(patients)
            ]
    
    @staticmethod
    def format_candidate_pool(results: Dict[str, TrialCandidatePool]) -> str:
        """Format candidate pool results for display (unranked)"""
        output = []
        output.append("=" * 70)
        output.append("ELIGIBLE CANDIDATE POOLS (UNRANKED)")
        output.append("=" * 70)
        output.append("Note: Candidates are NOT ranked to avoid selection bias.")
        output.append("All candidates in the pool meet eligibility criteria.")
        
        for trial_id, result in results.items():
            output.append(f"\n{'─' * 70}")
            output.append(f"TRIAL: {result.trial_name}")
            output.append(f"ID: {result.trial_id} | Condition: {result.condition}")
            output.append(f"Required: {result.required_candidates} | "
                         f"Pool Size: {result.candidates_in_pool} (1.5x target)")
            output.append(f"Total Evaluated: {result.processing_stats['total_patients_evaluated']} | "
                         f"Eligible Found: {result.processing_stats['eligible_candidates_found']}")
            output.append("─" * 70)
            
            if not result.eligible_candidates:
                output.append("  ⚠️  No eligible candidates found for this trial")
                continue
            
            output.append(f"\n  ELIGIBLE CANDIDATE POOL ({len(result.eligible_candidates)} candidates):")
            output.append("  " + "-" * 66)
            
            for candidate in result.eligible_candidates:
                status_emoji = {
                    'Fully Eligible': '🟢',
                    'Likely Eligible': '🟡',
                    'Conditionally Eligible': '🟠',
                }.get(candidate.eligibility_status, '⚪')
                
                output.append(f"\n  • {candidate.patient_id}")
                output.append(f"    {status_emoji} {candidate.eligibility_status} | "
                             f"Confidence: {candidate.confidence:.0%}")
                
                if candidate.qualifying_factors:
                    output.append("    ✓ Qualifies: " + "; ".join(candidate.qualifying_factors[:3]))
                
                if candidate.pending_verification:
                    output.append("    ? Verify: " + ", ".join(candidate.pending_verification[:3]))
        
        output.append("\n" + "=" * 70)
        return "\n".join(output)
    
    @staticmethod
    def to_json(results: Dict[str, TrialCandidatePool]) -> str:
        """Convert results to JSON for API responses"""
        serializable = {}
        for trial_id, result in results.items():
            serializable[trial_id] = {
                'trial_id': result.trial_id,
                'trial_name': result.trial_name,
                'condition': result.condition,
                'required_candidates': result.required_candidates,
                'candidates_in_pool': result.candidates_in_pool,
                'processing_stats': result.processing_stats,
                'eligible_candidates': [asdict(c) for c in result.eligible_candidates]
            }
        return json.dumps(serializable, indent=2)


# Convenience functions for backwards compatibility
async def select_candidates_for_trial(patients, trial, required_candidates=10, multiplier=1.5):
    return await CandidateSelector.select_candidates_for_trial(
        patients, trial, required_candidates, multiplier
    )

async def select_candidates_for_all_trials(patients, trials, required_per_trial=None, 
                                           default_required=10, multiplier=1.5):
    return await CandidateSelector.select_candidates_for_all_trials(
        patients, trials, required_per_trial, default_required, multiplier
    )