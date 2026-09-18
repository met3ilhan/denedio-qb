export {
  createFingerprintRepository,
  FingerprintLockedError,
  isFingerprintVersionImmutable,
  mergeMutableFingerprintUpdate,
} from "./repository/fingerprint-repository";
export { inferFingerprintDraftFromExtraction } from "./services/draft-inference";
