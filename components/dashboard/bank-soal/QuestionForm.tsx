"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Tag, PlayCircle } from "lucide-react";
import { createQuestion, updateQuestion } from "@/app/actions/questions";
import { useRouter } from "next/navigation";
import { simulateQuestionScore } from "@/app/actions/exams";

import StatusBadge from "../StatusBadge";
import TopicModal from "./TopicModal";
import type { TopicRecord } from "@/app/actions/topics";

interface QuestionFormProps {
    initialData?: any;
    userRole?: string;
    existingTopics?: TopicRecord[];
}

export default function QuestionForm({ initialData, userRole = "pembina", existingTopics = [] }: QuestionFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState(initialData?.type || "MULTIPLE_CHOICE");

    // Scoring State
    const [weight, setWeight] = useState(initialData?.weight || 1);

    // Multiple Choice Options
    const [options, setOptions] = useState(initialData?.options || [
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
    ]);

    // Short Answer Keys
    const [answerKeys, setAnswerKeys] = useState<{ key: string; type: "TEXT" | "NUMERIC"; tolerance: number }[]>(
        initialData?.answerKeys || [{ key: "", type: "TEXT", tolerance: 0 }]
    );

    // Essay Rubric
    const [rubric, setRubric] = useState<{ component: string; keywords: string; points: number }[]>(
        initialData?.rubric?.map((r: any) => ({
            ...r,
            keywords: Array.isArray(r.keywords) ? r.keywords.join(", ") : (r.keywords || "")
        })) ||
        [{ component: "", keywords: "", points: 0 }]
    );

    // Simulation State
    const [simulatedAnswer, setSimulatedAnswer] = useState("");
    const [simulationResult, setSimulationResult] = useState<any>(null);

    const topicNames = existingTopics.map((t) => t.name);
    const [topicsList, setTopicsList] = useState<TopicRecord[]>(existingTopics);
    const [topicChoice, setTopicChoice] = useState<string>(() => {
        if (initialData?.topic && topicNames.includes(initialData.topic)) return initialData.topic;
        return topicNames[0] ?? "";
    });
    const [showTopicModal, setShowTopicModal] = useState(false);

    useEffect(() => {
        setTopicsList(existingTopics);
        const names = existingTopics.map((t) => t.name);
        setTopicChoice((prev) => (names.includes(prev) ? prev : names[0] ?? ""));
    }, [existingTopics]);

    // --- Handlers ---

    // Options (MC)
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].content = value;
        setOptions(newOptions);
    };

    const handleCorrectOptionChange = (index: number) => {
        const newOptions = options.map((opt: any, i: number) => ({
            ...opt,
            isCorrect: i === index
        }));
        setOptions(newOptions);
    };

    const handleAddOption = () => {
        setOptions([...options, { content: "", isCorrect: false }]);
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = options.filter((_: any, i: number) => i !== index);
        setOptions(newOptions);
    };

    // Answer Keys (Short Answer)
    const handleKeyChange = (index: number, field: string, value: any) => {
        const newKeys = [...answerKeys] as any;
        newKeys[index][field] = value;
        setAnswerKeys(newKeys);
    };

    const handleAddKey = () => {
        setAnswerKeys([...answerKeys, { key: "", type: "TEXT", tolerance: 0 }]);
    };

    const handleRemoveKey = (index: number) => {
        const newKeys = answerKeys.filter((_, i) => i !== index);
        setAnswerKeys(newKeys);
    };

    // Rubric (Essay)
    const handleRubricChange = (index: number, field: string, value: any) => {
        const newRubric = [...rubric] as any;
        newRubric[index][field] = value;
        setRubric(newRubric);
    };

    const handleAddRubric = () => {
        setRubric([...rubric, { component: "", keywords: "", points: 0 }]);
    };

    const handleRemoveRubric = (index: number) => {
        const newRubric = rubric.filter((_, i) => i !== index);
        setRubric(newRubric);
    };

    const handleSimulate = async () => {
        setIsLoading(true);
        // Prepare data for simulation
        // For MC options, we need IDs to match answers (if new/draft, use index)
        const optionsWithIds = options.map((o: any, i: number) => ({
            ...o,
            id: o.id || i
        }));

        const questionData = {
            type,
            weight,
            options: optionsWithIds,
            answerKeys,
            rubric: rubric.map((r: any) => ({
                ...r,
                keywords: typeof r.keywords === 'string' ? r.keywords.split(",").map((k: string) => k.trim()) : r.keywords
            }))
        };

        const result = await simulateQuestionScore(questionData, simulatedAnswer);
        setSimulationResult(result);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (topicsList.length === 0 || !topicChoice) {
            alert("Tambahkan minimal satu topik lewat tombol Kelola sebelum menyimpan.");
            return;
        }
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        const correctIndex = options.findIndex((o: any) => o.isCorrect);
        formData.set("correct_option", correctIndex.toString());

        // Add Scoring Fields manually as JSON since they are complex objects
        formData.set("weight", weight.toString());
        formData.set("answer_keys", JSON.stringify(answerKeys));
        formData.set("rubric", JSON.stringify(rubric));

        formData.set("topic", topicChoice || "General");

        let result;
        if (initialData?.id) {
            result = await updateQuestion(initialData.id, formData);
        } else {
            result = await createQuestion(null, formData);
        }

        if (result.success) {
            router.push("/dashboard/bank-soal");
            router.refresh();
        } else {
            alert(result.message || "Failed to save question");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text-dark">Question Metadata</h3>
                    {initialData?.status && <StatusBadge status={initialData.status} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Selection */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-dark mb-1">Status</label>
                        <select
                            name="status"
                            defaultValue={initialData?.status || "DRAFT"}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PENDING">Pending Review</option>
                            {userRole === "admin" && (
                                <option value="PUBLISHED">Published</option>
                            )}
                            <option value="ARCHIVED">Archived</option>
                        </select>
                        {userRole !== "admin" && (
                            <p className="text-xs text-text-dark/40 mt-1">
                                * Submitting as "Published" will automatically set status to "Pending Review" for approval.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Topic</label>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white"
                                value={topicChoice}
                                onChange={(e) => setTopicChoice(e.target.value)}
                                aria-label="Pilih topik"
                            >
                                {topicsList.length === 0 ? (
                                    <option value="">Belum ada topik</option>
                                ) : (
                                    topicsList.map((t) => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                    ))
                                )}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowTopicModal(true)}
                                className="inline-flex items-center gap-2 px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 text-text-dark"
                                title="Kelola topik"
                            >
                                <Tag className="w-4 h-4" />
                                Kelola
                            </button>
                        </div>
                        <p className="text-xs text-text-dark/40 mt-1">
                            Tambah atau edit topik lewat tombol Kelola.
                        </p>
                    </div>
                    <TopicModal
                        open={showTopicModal}
                        onClose={() => setShowTopicModal(false)}
                        onTopicsChange={setTopicsList}
                    />
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Subtopic</label>
                        <input
                            type="text"
                            name="subtopic"
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            placeholder="e.g. Plate Tectonics"
                            defaultValue={initialData?.subtopic}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Weight (Score)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            value={weight}
                            onChange={(e) => setWeight(parseFloat(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Difficulty</label>
                        <select
                            name="difficulty"
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            defaultValue={initialData?.difficulty}
                        >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Type</label>
                        <select
                            name="type"
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                            <option value="SHORT_ANSWER">Short Answer</option>
                            <option value="ESSAY">Essay</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Source / Year</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="source"
                                className="flex-1 px-3 py-2 border border-neutral-warm/30 rounded-lg"
                                placeholder="OSN 2023"
                                defaultValue={initialData?.source}
                            />
                            <input
                                type="number"
                                name="year"
                                className="w-24 px-3 py-2 border border-neutral-warm/30 rounded-lg"
                                defaultValue={initialData?.year || new Date().getFullYear()}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Content Block */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-4">
                <h3 className="text-lg font-bold text-text-dark">Question Content</h3>
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Question Text</label>
                    <textarea
                        name="content"
                        rows={4}
                        className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                        required
                        defaultValue={initialData?.content}
                    />
                </div>

                {type === "MULTIPLE_CHOICE" && (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-text-dark">Options</label>
                        {options.map((option: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="correct_option_visual" // Just for visual in UI, logic handled by state
                                    checked={option.isCorrect}
                                    onChange={() => handleCorrectOptionChange(idx)}
                                    className="h-4 w-4 text-accent-earthy"
                                />
                                <span className="font-mono text-text-dark/60 font-bold">{String.fromCharCode(65 + idx)}.</span>
                                <input
                                    type="text"
                                    name="option_content" // All options will be collected as array
                                    value={option.content}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-neutral-warm/30 rounded-lg"
                                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                    required
                                />
                                <button type="button" onClick={() => handleRemoveOption(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddOption} className="text-sm font-medium text-accent-earthy flex items-center gap-1 mt-2">
                            <Plus className="w-4 h-4" /> Add Option
                        </button>
                    </div>
                )}

                {type === "SHORT_ANSWER" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-text-dark">Answer Keys (Synonyms/Values)</label>
                            <span className="text-xs text-text-dark/40 bg-neutral-100 px-2 py-1 rounded">Text = Exact Match</span>
                        </div>

                        {answerKeys.map((key, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-center p-3 bg-neutral-light/30 rounded-lg border border-neutral-warm/20">
                                <select
                                    className="px-2 py-2 border border-neutral-warm/30 rounded-lg text-sm bg-white"
                                    value={key.type}
                                    onChange={(e) => handleKeyChange(idx, "type", e.target.value)}
                                >
                                    <option value="TEXT">Text</option>
                                    <option value="NUMERIC">Numeric</option>
                                </select>

                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-neutral-warm/30 rounded-lg"
                                    placeholder={key.type === "NUMERIC" ? "e.g. 10.5" : "Correct Answer Text"}
                                    value={key.key}
                                    onChange={(e) => handleKeyChange(idx, "key", e.target.value)}
                                    required
                                />

                                {key.type === "NUMERIC" && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-text-dark/60">±</span>
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-2 border border-neutral-warm/30 rounded-lg text-sm"
                                            placeholder="Tol."
                                            value={key.tolerance}
                                            onChange={(e) => handleKeyChange(idx, "tolerance", parseFloat(e.target.value) || 0)}
                                            step="0.01"
                                        />
                                        <span className="text-xs text-text-dark/60">(Val)</span>
                                    </div>
                                )}

                                <button type="button" onClick={() => handleRemoveKey(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddKey} className="text-sm font-medium text-accent-earthy flex items-center gap-1 mt-2">
                            <Plus className="w-4 h-4" /> Add Answer Key
                        </button>
                    </div>
                )}

                {type === "ESSAY" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-text-dark">Rubric / Grading Components</label>
                            <span className="text-xs text-text-dark/40 bg-neutral-100 px-2 py-1 rounded">Keyword Matching</span>
                        </div>

                        {rubric.map((item, idx) => (
                            <div key={idx} className="p-4 bg-neutral-light/30 rounded-lg border border-neutral-warm/20 space-y-3 relative">
                                <button type="button" onClick={() => handleRemoveRubric(idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div className="md:col-span-3">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg text-sm font-medium"
                                            placeholder="Component Description (e.g. Explains Subduction)"
                                            value={item.component}
                                            onChange={(e) => handleRubricChange(idx, "component", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg text-sm"
                                            placeholder="Points"
                                            value={item.points}
                                            onChange={(e) => handleRubricChange(idx, "points", parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <textarea
                                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg text-sm"
                                            placeholder="Keywords (comma separated): e.g. subduction, collision, trench"
                                            rows={2}
                                            value={item.keywords}
                                            onChange={(e) => handleRubricChange(idx, "keywords", e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-text-dark/40 mt-1">Separate keywords with commas.</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddRubric} className="text-sm font-medium text-accent-earthy flex items-center gap-1 mt-2">
                            <Plus className="w-4 h-4" /> Add Grading Component
                        </button>
                    </div>
                )}
            </div>

            {/* Explanation Block */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-4">
                <h3 className="text-lg font-bold text-text-dark">Explanation / Answer Key</h3>
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Explanation</label>
                    <textarea
                        name="explanation"
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                        placeholder="Explain why the answer is correct..."
                        defaultValue={initialData?.explanation}
                    />
                </div>
            </div>

            {/* Simulation Block */}
            <div className="bg-neutral-light/50 p-6 rounded-xl border border-neutral-warm/20 space-y-4">
                <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
                    <span className="bg-accent-earthy/10 text-accent-earthy px-2 py-1 rounded text-sm">Preview</span>
                    Scoring Simulation
                </h3>
                <p className="text-sm text-text-dark/60">Uji logika penilaian sebelum menyimpan soal.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Jawaban Uji</label>
                        {type === "MULTIPLE_CHOICE" ? (
                            <select
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg text-sm bg-white"
                                value={simulatedAnswer}
                                onChange={(e) => setSimulatedAnswer(e.target.value)}
                            >
                                <option value="">Pilih opsi jawaban</option>
                                {options.map((opt: any, i: number) => {
                                    const label = opt.content
                                        ? `${String.fromCharCode(65 + i)}. ${String(opt.content).slice(0, 60)}${(opt.content?.length || 0) > 60 ? "…" : ""}`
                                        : `Option ${String.fromCharCode(65 + i)}`;
                                    return (
                                        <option key={i} value={opt.id?.toString() || i.toString()}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : type === "ESSAY" ? (
                            <textarea
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg text-sm"
                                rows={3}
                                placeholder="Ketik contoh jawaban essay untuk ditest..."
                                value={simulatedAnswer}
                                onChange={(e) => setSimulatedAnswer(e.target.value)}
                            />
                        ) : (
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg text-sm"
                                placeholder="Ketik contoh jawaban singkat untuk ditest..."
                                value={simulatedAnswer}
                                onChange={(e) => setSimulatedAnswer(e.target.value)}
                            />
                        )}
                        <button
                            type="button"
                            onClick={handleSimulate}
                            disabled={isLoading}
                            className="mt-3 w-full px-4 py-2 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90 text-sm font-bold disabled:opacity-50"
                        >
                            {isLoading ? "Menghitung..." : "Hitung Skor"}
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-neutral-warm/30 min-h-[150px]">
                        {simulationResult ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-neutral-warm/10 pb-2">
                                    <span className="text-sm font-medium text-text-dark/70">Status Simulasi:</span>
                                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${simulationResult.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {simulationResult.success ? "Berhasil" : "Gagal"}
                                    </span>
                                </div>
                                {simulationResult.result && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-text-dark/70">Skor:</span>
                                            <span className="font-bold text-accent-earthy text-lg">
                                                {typeof simulationResult.result.earned === 'number' ? simulationResult.result.earned.toFixed(2) : simulationResult.result.earned}
                                                <span className="text-sm text-text-dark/40 font-normal ml-1">/ {weight}</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-text-dark/70">Benar:</span>
                                            <span className={`font-bold ${simulationResult.result.isCorrect ? "text-green-600" : "text-red-500"}`}>
                                                {simulationResult.result.isCorrect ? "Ya" : "Tidak"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-text-dark/70 block mb-1">Umpan Balik:</span>
                                            <div className="text-xs bg-neutral-50 p-2 rounded border border-neutral-warm/10 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                {simulationResult.result.feedback || "Tidak ada umpan balik khusus."}
                                            </div>
                                        </div>
                                    </>
                                )}
                                {simulationResult.message && (
                                    <p className="text-red-500 text-sm font-medium">{simulationResult.message}</p>
                                )}
                            </div>
                        ) : (
                            <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-text-dark/40 text-sm gap-2">
                                <PlayCircle className="w-10 h-10 text-text-dark/20" />
                                <span>Pilih jawaban dan klik &quot;Hitung Skor&quot;</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {isLoading ? "Saving..." : "Save Question"}
                </button>
            </div>
        </form>
    );
}
