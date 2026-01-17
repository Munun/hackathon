"""
PharmaTrace AI Utilities Package
"""
from .medical_extractor import MedicalDataExtractor, extract_patient_data, validate_medical_document
from .trial_matcher import TrialMatcher, match_patient_to_trials
from .sample_generator import SampleDataGenerator, generate_sample_patients, generate_sample_trials, create_sample_pdf
try:
    from .candidate_Ranker import (
        CandidateRanker,
        RankedCandidate,
        TrialRankingResult,
        rank_candidates_for_trial,
        rank_candidates_for_all_trials
    )
except ImportError:
    # candidate_Ranker is optional
    pass

__all__ = [
    # Medical Extractor
    'MedicalDataExtractor',
    'extract_patient_data',
    'validate_medical_document',
    
    # Trial Matcher (single patient)
    'TrialMatcher',
    'match_patient_to_trials',
    
    # Sample Generator
    'SampleDataGenerator',
    'generate_sample_patients',
    'generate_sample_trials',
    'create_sample_pdf',
    
    # Candidate Ranker (multi-patient ranking)
    'CandidateRanker',
    'RankedCandidate',
    'TrialRankingResult',
    'rank_candidates_for_trial',
    'rank_candidates_for_all_trials',
]