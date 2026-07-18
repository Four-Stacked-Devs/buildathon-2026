import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Setup.module.css";
import { Header, PrimaryButton, Screen } from "@/components/Primitives";
import { generateQuestions } from "@/api/gabai";
import { useSession } from "@/state/session";
import { exerciseTypeSchema } from "@gabai/shared";

const allTypes = exerciseTypeSchema.options;

export function SetupPage() {
  const navigate = useNavigate();
  const { sourceId, selectedTypes, setSelectedTypes, questionCount, setQuestionCount, setQuestions, settings } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const disabled = selectedTypes.length === 0 || !sourceId || loading;

  useEffect(() => {
    document.title = "Ihanda ang review — GabAI";
  }, []);

  async function startReview() {
    if (!sourceId || selectedTypes.length === 0) return;
    setError("");
    setLoading(true);
    try {
      const response = await generateQuestions(sourceId, selectedTypes, questionCount, settings.language);
      setQuestions(response.questions);
      navigate("/session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate questions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      footer={
        <PrimaryButton disabled={disabled} onClick={startReview} style={{ width: "100%" }}>
          {loading ? "Generating..." : "Start review"}
        </PrimaryButton>
      }
    >
      <Header title="Ihanda ang review" onBack={() => navigate(-1)} />
      <span className={`t-caption ${styles.label}`}>Question types</span>
      {!sourceId ? <p className={styles.empty}>Choose a source before starting a review.</p> : null}
      {disabled && sourceId && !loading ? <p className={styles.empty}>Pick at least one question type to continue.</p> : null}
      <div className={styles.chips}>
        {allTypes.map((typeName) => {
          const selected = selectedTypes.includes(typeName);
          return (
            <button
              key={typeName}
              type="button"
              aria-pressed={selected}
              className={`${styles.typeChip}${selected ? ` ${styles.typeChipSelected}` : ""}`}
              onClick={() =>
                setSelectedTypes(
                  selected
                    ? selectedTypes.filter((item) => item !== typeName)
                    : [...selectedTypes, typeName],
                )
              }
            >
              {typeName.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>
      <span className={`t-caption ${styles.label}`}>Question count</span>
      <div className={styles.segment}>
        {[5, 10, 15].map((count) => {
          const active = count === questionCount;
          return (
            <PrimaryButton
              key={count}
              variant={active ? "primary" : "tertiary"}
              onClick={() => setQuestionCount(count)}
              className={`${styles.countButton}${active ? ` ${styles.countActive}` : ""}`}
            >
              {count}
            </PrimaryButton>
          );
        })}
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <p className={styles.note}>Questions will be generated from your uploaded or pasted material.</p>
    </Screen>
  );
}
