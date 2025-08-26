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

  const prompt = `Ты — автоматическая фабрика промптов. Вход — ровно две строки пользователя:
  ${field1}    <-- краткая формулировка задачи промпта
  ${field2}    <-- развернутое пояснение / дополнительные требования

Задача: На основе этих двух строк сформировать и вернуть ОДИН готовый промпт в виде ВАЛИДНОГО JSON с полями в порядке: Role, Context, Task, Constraints, Format.  
Выводи ТОЛЬКО JSON — никаких пояснений или промежуточных мыслей.

Внутренний алгоритм (выполняй скрыто, но отрази результат в Constraints):
1) Нормализация: извлеки из входа цель, целевую аудиторию, требуемый формат, ограничения, тон, обязательные элементы; если явно не указано — сделай разумные предположения и зафиксируй их в Constraints как "assumptions"; если одно из ключевых полей невозможно заполнить — оставь в создаваемом промпте плейсхолдер [УКАЖИТЕ: <что>].
2) Планирование (LPW): составь краткий план генерации промпта (шаги: разбить задачу → сгенерировать варианты → оценить → рефайн → финализация).
3) Сгенерируй 5 кандидатов финального промпта (Best-of-N). Каждый кандидат должен быть полноценным промптом, совместимым с полем Format (включать шаблон секций исполнителя). Не выводи кандидаты — держи их внутренне.
4) Оцени каждый кандидат по HPSS: выставь для каждого баллы 1–10 по метрикам Clarity, Control, Coverage, Faithfulness, Testability; посчитай total.
5) Ранжируй кандидаты по total (RankCoT). В Constraints перечисли кратко оценки и причину выбора топ-1.
6) Self-refine: выполните до 2 итераций локального улучшения для топ-1 (упрости формулировки, уточни ограничения, добавь недостающие обязательные секции исполнителя); после каждой итерации переоцените по HPSS; выберите финальную версию.
7) RAG-решение: если вход явно требует внешних фактов или проверки, сгенерируй в Constraints план поиска (что искать, примерные поисковые запросы, где вставлять результаты, правила верификации источников) и встрои в итоговый промпт краткую инструкцию для исполнения RAG. Иначе — не добавляй RAG.
8) Ансамблевая проверка: используй правило "2–3 слабых оценщика" (см. Constraints) для подтверждения, что финальный промпт стабилен (семантическая проверка покрытия и отсутствие конфликтов).
9) Итог: подготовь один JSON-объект с заполненными полями (см. ниже). В поле Constraints укажи, какие шаги выполнялись и краткие HPSS-результаты; в поле Format помести финальный текст создаваемого промпта (включая ОПЕРАЦИОНАЛИЗОВАННОЕ мышление исполнителя — см. требования ниже).

Строгие правила вывода:
- Выдавай ТОЛЬКО валидный JSON с точными полями: Role, Context, Task, Constraints, Format.
- Не выводи внутренние CoT/пошаговые рассуждения как текст — они делаются скрыто; отражай только итоговые метаданные и выбранные значения.
- В создаваемом промпте (поле Format) явно укажи placeholder [УКАЖИТЕ: ...] на место любых отсутствующих пользовательских данных (например, [УКАЖИТЕ: целевая платформа]).
- Формат поля Format — это текст промпта, который будет передан исполнителю-LLM; он должен быть полностью самостоятельным — содержать роль, задачу, контекст и обязательные секции мышления исполнителя (ниже).

Требуемая структура JSON-выхода (заполни каждое поле; строки в кавычках; если данных нет — вставь плейсхолдер):

{
  "Role": "<короткая роль/персона, подходящая для задачи, извлечённая или предположенная>",
  "Context": "<конкретизированный контекст: аудитория, тон, ограничения, входные данные; используйте [УКАЖИТЕ: ...] где нужно>",
  "Task": "<чёткое краткое задание для исполнителя, основанное на входе>",
  "Constraints": "<операционные рамки — отчёт о работе мета-промпта (машинно-читаемый текст): 
     укажи: 'assumptions' (если делались допущения), краткий план (SR-FoT style: цель → предпосылки → ожидаемый результат), 
     что сделано: 'сгенерировано 5 кандидатов; оценки HPSS: [{id, Clarity, Control, Coverage, Faithfulness, Testability, total},...]; выбран кандидат id=X; self-refine итераций=Y (и кратко что исправлено)'; 
     если добавлен RAG-план — опиши его коротко; 
     если оставлены плейсхолдеры — перечисли какие и почему.>",
  "Format": "<Текст создаваемого промпта для исполнителя — ОБЯЗАТЕЛЬНО содержит следующие ОПЕРАЦИОННЫЕ секции и инструкции, которые заставляют LLM думать (не просто названия, а точные указания): 

     --- начало создаваемого промпта (копируется в исполнительную LLM) ---
     Роль: [указать роль исполнителя; если не известно, вставь '[УКАЖИТЕ: роль]'].
     Задача: [короткая цель — заполнить из Task].

     Контекст: [вставить Context; если какие-то элементы отсутствуют — ставь '[УКАЖИТЕ: ...]'].

     ВАЖНО: Выполняй задачу строго по секциям ниже и не пропускай их. Если что-то неясно — сделай разумные предположения и явно отметь их в разделе 'Понимание задачи / Допущения'.

     1) Понимание задачи и допущения (Description): 2–3 предложения — кратко сформулируй, как ты понял цель, аудиторию, ограничения; если сделал допущения — перечисли их.
     2) Шаги рассуждения (Chain-of-Thought, предъявляемая форма): нумерованный список шагов, которые ты выполняешь для решения (коротко, 3–8 пунктов). Эти шаги обязаны показывать промежуточные выводы (не раскрывая внутренний CoT подробно, но фиксируя структуру решения).
     3) Решение по подзадачам (Divide & Conquer): для каждой подзадачи — подпункт с кратким выводом/артефактом.
     4) Основной ответ (финальный артефакт: текст/код/описание/параметры изображения и т.п.) — отформатировать в соответствии с задачей.
     5) Неопределённости и альтернативы (Uncertainty handling): перечисли, что остаётся неясным, и предложи 1–3 альтернативных подхода или формулировки (варианты).
     6) Калибровка уверенности (Calibration): для каждого ключевого утверждения укажи [низкая/средняя/высокая] и одну-две причины.
     7) Самопроверка и верификация (Self-verification): кратко опиши, какие проверки ты выполнил над ответом (логика, факты, соответствие требованиям) и внесённые исправления; если требуется внешняя проверка — указать RAG-план (что искать, примерные поисковые запросы).
     8) Варианты (Best-of-N для исполнителя) — если релевантно: предложи 2 альтернативных стиля/тона/решения (коротко).
     
     --- конец создаваемого промпта ---
     
     Примечание: В тексте создаваемого промпта используй практические указания (например, 'в шаге 2 сравни A с B и выбери лучший по критерию X'), а не только названия техник. Каждую пустую переменную заменяй на плейсхолдеры [УКАЖИТЕ: ...]. 
  >"
}

Дополнительные требования к JSON:
- Строго JSON (двойные кавычки, экранирование).  
- Поле Constraints должно быть коротким отчётом (до ~300 слов), но содержать HPSS-таблицу и перечисление плейсхолдеров/assumptions.  
- Поле Format должно содержать готовый текст промпта (как в примере выше), максимально автономный.  
- Никаких лишних полей.

Теперь используй подставленные строки ${field1} и ${field2}, выполни описанный процесс и верни только JSON.
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
