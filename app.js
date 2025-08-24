// === ОТПРАВКА ДАННЫХ ===
document.getElementById("send").addEventListener("click", async () => {
  const button = document.getElementById("send");
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;

  if (!field1 && !field2) {
    alert("Введите хотя бы одно значение!");
    return;
  }

  const prompt = `Роль: ты — мета-промпт — автоматическая фабрика промптов. Твоя задача: на основе данных пользователя сгенерировать один или несколько готовых промптов для исполнителя (LLM), причём в каждый финальный промпт обязателен вшитый исполнительный шаблон мышления (чтобы LLM действительно «думала» по шагам).

===========================
Блок 1 — Цель
===========================
Цель:
  "На основе введённых пользователем данных ${field1} сгенерировать готовый промпт для LLM, максимально точный под задачу пользователя, содержащий встроенное исполнительское мышление и тестовые примеры."

===========================
Блок 2 — Контекст
===========================
Контекст:
  "Входные данные пользователя: ${field2}
   Возможные task_type: {text_generation, image_generation, data_analysis, RAG, test_generation, other}.
   Ограничения/параметры: если заданы — учитывай строго."

===========================
Параметры по умолчанию (можно переопределять входом):
  n_candidates = 5
  n_refinements = 3
  eval_scale = 1..10
  scoring_weights = {clarity:0.25, coverage:0.20, faithfulness:0.20, controllability:0.15, robustness:0.10, efficiency:0.10}
  accept_threshold = 0.8  # доля от макс. возможного балла

===========================
Блок 3 — Инструкции мета-промпта (мышление архитектора) — выполняй строго по шагам
===========================
1) Нормализация
   1.1. Переформулируй цель в 1–2 предложения → сохрани как normalized_goal.
   1.2. Выдели предпосылки и ключевые ограничения (major / minor premises).
   1.3. Определи task_type (см. список выше).

2) Планирование
   - Составь план: produce_candidates → evaluate → refine → pack_output.
   - Если task_type == RAG или требует внешних фактов — пометь retrieval_stage и подготовь retrieval_plan.

3) Генерация кандидатов
   - Сгенерируй n_candidates промптов-шаблонов, варьируя:
       * явность инструкций,
       * формат вывода (текст / JSON / маркированный),
       * степень контроля (high/medium/low),
       * глубину встроенного мышления (подробный CoT vs минимальный CoT).
   - Для каждого кандидата добавь краткую rationale (почему подходит).

4) Оценка кандидатов
   - Для каждого кандидата получи оценки по: clarity, coverage, faithfulness, controllability, robustness, efficiency (1–10).
   - Смоделируй минимум 3 «слабых оценщика» (разные критерии) и агрегируй по scoring_weights.
   - Посчитай итоговый скор и ранжируй кандидатов.

5) Self-refine
   - Выбери топ_k (обычно top_1). Применяй до n_refinements итераций:
       * попроси модель выполнить самокритику candidate → выявить слабые места → внести правки → переоценить.
       * останавливайся раньше, если скор >= accept_threshold.
   - Если ни один кандидат не достигает accept_threshold — подготовь уточняющие вопросы к пользователю (конкретные, не больше 3).

6) RAG / Retrieval (если требуется)
   - Если task_type требует фактов: сформируй подзапросы для поиска, инструкции по валидации источников (primary > secondary), и укажи, как инкорпорировать цитаты/ссылки в финальный ответ.

7) Встраивание исполнительского мышления (обязательное)
   - В каждый final_prompt вставь embedded_executor_schema (см. ниже). Эта схема — гарант, что исполнитель будет мыслить: Understanding → Reasoning → Subtasks → Main Answer → Uncertainties → Confidence.
   - Подстраивай глубину и стиль схемы под task_type (креатив — больше примеров/стилей; аналитика — больше промежуточных вычислений).

8) Тесты и валидация
   - Сгенерируй 2–3 test_cases (контрольных входа) и пример ожидаемого заполнения всех секций схемы.
   - Прогоняй быстрый симуляционный чек: убедись, что test_cases дают заполненные секции.

9) Логирование и прозрачность
   - В meta_rationale фиксируй: normalized_goal, применённые методы (SR-FoT, RankCoT, HPSS и т.д.), оценки, selected_candidate_id, iterations.

10) Поведение при конфликте/недостатке данных
   - Не «угадывай» критичные факты. Если данных нет — сформируй 1–3 конкретных уточняющих вопроса.
   - В возвращаемом JSON пометь необходимость уточнения и причину.

===========================
Блок 4 — Формат вывода (строгая JSON-схема). Здесь живёт мышление создаваемого промпта
===========================
Возвращай строго валидный JSON (двойные кавычки, экранирование). Структура:

{
  "final_prompt": "<строка: полностью готовый промпт для исполнителя (включая embedded_executor_schema)>",
  "alternatives": ["<вариант_1>", "<вариант_2>", ...],
  "meta_rationale": {
    "normalized_goal": "<строка>",
    "applied_methods": ["SR-FoT","RankCoT","HPSS","LPW","DeepRAG"...],
    "scores": [
      {"candidate_id":1,"clarity":9,...,"total":34},
      ...
    ],
    "selected_candidate_id": <число>,
    "iterations": <число>
  },
  "embedded_executor_schema": {
    "role": "<роль исполнителя: аналитик/копирайтер/дизайнер/...>",
    "task": "<формальная формулировка задачи>",
    "context": "<обоснованные данные/ограничения>",
    "instructions": "<КРАТКО: обязан выполнять строго по format_output секциям>",
    "format_output": {
      "1_understanding": "Description — 1-3 предложения: как ты понял задачу и ключевые ограничения",
      "2_reasoning_steps": "Chain-of-Thought — нумерованный список промежуточных рассуждений и вычислений",
      "3_subtasks": "Divide & Conquer — подзадачи и вывод по каждой",
      "4_main_answer": "Финальный ответ в требуемом формате (текст/код/JSON/метаданные)",
      "5_uncertainties": "Uncertainty — что неясно, 1-3 альтернативы/гипотезы",
      "6_confidence": "Calibration — уровень уверенности (низкая/средняя/высокая) по ключевым пунктам + короткое обоснование"
    }
  },
  "test_cases": [
    {"input":"<пример входа>","expected_output_example":"<пример заполненной схемы>"}
  ],
  "notes": "<доп. комментарии или уточняющие вопросы к пользователю>"
}

--> Обязательное требование: final_prompt должен содержать текстовые инструкции исполнителю, которые принуждают его заполнять все шесть секций format_output. Не использовать термины-метки как «SR-FoT» внутри final_prompt — вместо этого формулировать конкретные действия (например: «Сначала кратко опиши, как понял задачу»).

===========================
Блок 5 — Критерии качества (самопроверка) и правило выхода
===========================
После генерации final_prompt выполни автоматическую самопроверку:

Критерии:
  1. Соответствие цели: final_prompt отражает normalized_goal.
  2. Полнота контекста: все релевантные поля из входа включены или помечены.
  3. Структурность: embedded_executor_schema присутствует и корректно заполнена в примере.
  4. Встроенное мышление: format_output содержит 6 обязательных секций.
  5. Проверка test_cases: для каждого test_case ожидаемый пример покрывает все секции.
  6. Ясность формулировок: инструкции однозначны, не содержат двусмысленностей.
  7. Нет предсказуемых галлюцинаций: final_prompt не вставляет «факты» от себя.
  8. Прозрачность: meta_rationale содержит оценки и применённые методы.

Правила:
  - Если все критерии пройдены → вернуть JSON (см. формат).
  - Если хотя бы 1 критерий не пройден → выполнить self-refine (см. Шаг 5) и повторно проверить; до n_refinements итераций.
  - Если после n_refinements проблема не решена → вернуть лучший кандидат с полем notes: "requires_user_clarification" и включить 1–3 конкретных уточняющих вопроса.

===========================
Доп. требования к final_prompt (чтобы исполнитель действительно «думал» по встроенному мышлению)
===========================
- Язык final_prompt — указанный в контексте.
- В final_prompt чётко прописать порядок действий исполнителя: сначала секция 1_understanding (1–2 предложения), затем 2_reasoning_steps (показывай промежуточные шаги), затем 3_subtasks и т.д.
- В final_prompt обязать исполнителя: "Не переходи к 'main_answer' прежде чем не заполнены секции 1–3".
- При необходимости указать templates/limits (например: «макс 3 альтернативы», «укажи 1–2 цитаты с источниками»).

===========================
Выходные поля (кратко)
===========================
Возвращаем JSON, как указано в Блоке 4. Поле final_prompt готово к вставке в исполнителя.`;

  // Блокируем кнопку и меняем текст
  button.disabled = true;
  button.textContent = "Обработка…";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }] // правильный формат для chat/completions
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ответ OpenRouter:", data);

    let text = "";
    if (Array.isArray(data.choices) && data.choices.length > 0) {
      text = data.choices[0].message.content || "Нет ответа от модели";
    } else {
      text = "Нет ответа от модели";
    }

    let resultDiv = document.getElementById("result");
    if (!resultDiv) {
      resultDiv = document.createElement("div");
      resultDiv.id = "result";
      resultDiv.style.marginTop = "12px";
      document.body.appendChild(resultDiv);
    }
    resultDiv.textContent = text;
  
// Добавляем кнопку "Скопировать", если её ещё нет
let copyButton = document.getElementById("copy");
if (!copyButton) {
  copyButton = document.createElement("button");
  copyButton.id = "copy";
  copyButton.textContent = "Скопировать";
  copyButton.style.marginTop = "8px";
  document.body.appendChild(copyButton);

  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(resultDiv.textContent)
      .then(() => {
        copyButton.textContent = "Скопировано!";
        setTimeout(() => copyButton.textContent = "Скопировать", 2000);
      })
      .catch(err => alert("Ошибка копирования: " + err));
  });
}

  } catch (err) {
    console.error("Ошибка запроса:", err);
    let resultDiv = document.getElementById("result");
    if (!resultDiv) {
      resultDiv = document.createElement("div");
      resultDiv.id = "result";
      resultDiv.style.marginTop = "12px";
      document.body.appendChild(resultDiv);
    }
    resultDiv.textContent = "Ошибка: " + err.message;
  } finally {
    // Возвращаем кнопку в нормальное состояние
    button.disabled = false;
    button.textContent = "Отправить";
  }
});
