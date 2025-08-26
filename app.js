// --- Телеграм данные ---
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user;

if (user) {
  const photo = document.getElementById("user-photo");
  const greeting = document.getElementById("user-greeting");
  const nameBlock = document.getElementById("user-name");

  if (user.photo_url) {
    photo.src = user.photo_url;
  } else {
    photo.style.display = "none";
  }

  greeting.textContent = `Привет, ${user.first_name || user.username || "гость"}! 👋`;
  nameBlock.textContent = user.username ? `@${user.username}` : "";
}


// === ОТПРАВКА ДАННЫХ ===
document.getElementById("send").addEventListener("click", async () => {
  const button = document.getElementById("send");
  const field1 = document.getElementById("field1").value;
  const field2 = document.getElementById("field2").value;

  if (!field1 && !field2) {
    alert("Введите хотя бы одно значение!");
    return;
  }

  const prompt = `Ты — фабрика промптов (Prompt Architect). Твоя задача — создавать структурированные промпты-исполнители для LLM в формате JSON. Ты не выполняешь задачу пользователя напрямую, а проектируешь промпт так, чтобы его можно было применить в любой LLM для выполнения задачи.

2. Контекст (The "Why"):
Входные данные пользователя:
Краткая формулировка задачи: «Написать посты»
Развернутое пояснение: «Цепочки постов для твиттера»

3. Задача (The "What"):
Создать промпт-исполнителя, который позволит LLM максимально эффективно выполнить задачу пользователя.

4. Ограничения и рамки (The "How Not To"):
Ты — архитектор. Строй промпты, используя следующие модели и методы мышления:
SR-FoT: строй логическую структуру по пятиэтапному шаблону.
RankCoT + BoN: генерируй несколько вариантов промптов и выбирай лучший.
HPSS: используй эвристику для оптимизации.
LLMSchema / Think-inside-JSON: выводи результат только в строгом JSON.
Self-organize / Self-improve / Self-refine: итеративно улучшай кандидатов.
Планирование (Macro-Action / LPW): сначала план → потом реализация.
RAG-ориентированные рамки (SAGE, DeepRAG): если задача требует поиска, строй соответствующие инструкции.
Ансамблевые оценщики: валидируй результат через несколько оценочных критериев.

5. Формат вывода (The "Give it to me this way"):
Выводи промпт-исполнителя только в формате JSON следующей структуры:
{
  "role": "Исполнитель. [УКАЖИТЕ роль LLM, которая будет решать задачу]",
  "context": "Вход пользователя: Написать посты. Пояснение: Цепочки постов для твиттера",
  "task": "Разобрать задачу и подготовить результат, используя обязательные когнитивные стратегии.",
  "constraints_and_frameworks": {
    "thinking_instructions": [
      "Применяй Chain-of-Thought: всегда рассуждай пошагово, показывай промежуточные шаги.",
      "Применяй Divide & Conquer: разбивай задачу на подзадачи и решай каждую отдельно.",
      "Используй Description-first (ISP2): сначала кратко опиши, как понял вход, затем рассуждай.",
      "Управляй неопределённостью: если не хватает данных, указывай пробелы и предлагай 1–3 альтернативных гипотез.",
      "Калибруй уверенность: указывай уровень уверенности для ключевых выводов.",
      "Применяй Self-verification / Self-refine: сначала дай ответ, затем проверь его и исправь ошибки.",
      "Best-of-N: предлагай несколько финальных вариантов/стилей ответа для выбора.",
      "Think-then-answer / LLMSchema: выводи результат строго в структурированных секциях (Понимание → Шаги → Итог → Неопределённости → Уверенность).",
      "Long-context tactics: если ввод длинный, разбивай его на части и обрабатывай поэтапно.",
      "RAG-patterns: если задача требует фактов, явно указывай, когда нужен поиск, и как встроить найденное."
    ],
    "notes": "Если данных недостаточно — вставляй плейсхолдеры в формате [УКАЖИТЕ …]."
  },
  "output_format": {
    "type": "TEXT | MARKDOWN",
    "schema": {
      "understanding": "Как модель поняла вход",
      "steps": "Пошаговое рассуждение",
      "solution": "Финальное решение",
      "alternatives": "Альтернативные варианты/гипотезы",
      "uncertainties": "Недостающие данные или сомнения",
      "confidence": "Уровень уверенности по ключевым выводам"
    }
  }
}
`;

  
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
        messages: [{ role: "user", content: prompt }]
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



// === ЛОГ В GOOGLE SHEETS (без чтения ответа, чтобы не упасть на CORS) ===
try {
  await fetch("https://script.google.com/macros/s/AKfycbxOXWl2ojtUJw8CJc3RibEJK958Yo8D0MkiNs3SvfHJv2ju65nxJVBE96Usei6psW4ghg/exec", {
    method: "POST",
    mode: "no-cors", // <-- главное
    headers: {
      "Content-Type": "text/plain;charset=utf-8" // <-- НЕЛЬЗЯ application/json
    },
    body: JSON.stringify({
      user_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "unknown",
      field1,
      field2
    })
  });
  // Ответ прочитать нельзя в no-cors — и не нужно.
} catch (e) {
  console.error("Ошибка отправки в Google Sheets (игнорируем для UX):", e);
}







    
    let resultDiv = document.getElementById("result");
    if (!resultDiv) {
      resultDiv = document.createElement("div");
      resultDiv.id = "result";
      resultDiv.style.marginTop = "12px";
      document.body.appendChild(resultDiv);
    }
    resultDiv.textContent = text;

    
// === КНОПКА "СКОПИРОВАТЬ" ===
let sendBtn = document.getElementById("send");
let copyButton = document.getElementById("copyButton");
if (!copyButton) {
  copyButton = document.createElement("button");
  copyButton.id = "copyButton";
  copyButton.textContent = "Скопировать";

  
  // наследуем стили у send
  copyButton.style.width = getComputedStyle(sendBtn).width;
  copyButton.style.height = getComputedStyle(sendBtn).height;
  copyButton.style.fontSize = getComputedStyle(sendBtn).fontSize;
  copyButton.style.borderRadius = getComputedStyle(sendBtn).borderRadius;

  
  // фиксируем
  copyButton.style.position = "fixed";
  copyButton.style.bottom = "10px";
  copyButton.style.left = sendBtn.getBoundingClientRect().left + "px";

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
