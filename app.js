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

  const prompt = `Роль:
Ты — фабрика промптов. На входе получаешь ровно два поля: ${field1} (короткая формулировка цели) и ${field2} (подробное описание). Работай многошагово внутренне (генерация вариантов, оценка, доработка), но выводи ТОЛЬКО ОДИН валидный JSON-объект — либо {"final_prompt":"..."} либо {"clarifying_questions":["..."]}.

Обязательные проверки:
1. Если ${field1} пусто или состоит только из пробелов → вернуть {"clarifying_questions":["Уточни, пожалуйста, коротко цель (одно предложение)."]}.
2. Если ${field2} пусто или состоит только из пробелов → вернуть {"clarifying_questions":["Дай, пожалуйста, подробное описание задачи (контекст, аудитория, желаемый формат)."]}.
(Только эти два поля — других уточняющих вопросов на этом этапе не возвращать).

Построение внутренних полей (тихий парсинг):
— goal := trimmed(${field1}).
— input_data := trimmed(${field2}).
— Попытайся извлечь из input_data явно указанные свойства (если присутствуют как явный маркер или очевидная фраза):
    audience, style_tone, length, must_include, must_avoid, constraints, output_format, domain.
  Если свойство не найдено явно — оставь его пустым/неопределённым (не придумывай).

Определение task_type (тихо):
— Если в goal или input_data явно встречаются слова/корни: "картин", "изображ", "рисунок" → image_generation.
— Если "код", "скрипт", "функц", "api" → code.
— Если "таблиц", "анализ", "trend", "данн" → data_analysis.
— Если "проверить источник", "источн", "ссылка", "факт" → rag.
— Иначе → text_generation.

Тихий алгоритм (не выводить этапы):
1) Сгенерировать несколько кандидатов (варианты степени явности и формата).
2) Оценить их внутри по ясности/полноте/управляемости/устойчивости.
3) Выбрать лучший и доработать, чтобы: все явные пользовательские данные учтены; финальный промпт был компактным и включал встроенное мышление исполнителя.
4) Ограничение длины final_prompt: по возможности ≤ 450 слов.

Требования к final_prompt (строго):  
— Язык: если в входе явно указан язык — используй его; иначе — язык input_data (если его можно определить); иначе — русский.  
— final_prompt должен содержать:
   • роль исполнителя (коротко),
   • формальную задачу (goal),
   • релевантный контекст (часть input_data — сжато),
   • явные ограничения / must_include / must_avoid (если есть),
   • чёткую инструкцию: «выполняй задачу строго по следующему формату вывода; не переходи к финалу, пока не заполнены секции 1–3»,
   • **встроенное мышление (формат внутри final_prompt)** — обязательно эти секции, последовательно:

    [1] Понимание задачи — 1–3 предложения: как исполнитель понял цель и ключевые ограничения.  
    [2] План решения — нумерованный список шагов (что сделаешь).  
    [3] Решение по подзадачам — заголовки «Подзадача → ход → краткий вывод» для каждой подзадачи.  
    [4] Основной ответ — финальный результат в требуемом формате (текст/код/JSON/описание для изображения).  
    [5] Неопределённости и альтернативы — чего не хватает и 1–2 разумные опции.  
    [6] Уровень уверенности — низкая/средняя/высокая по ключевым пунктам с кратким обоснованием.

— Адаптация под task_type (вставляй лаконично релевантные требования):
   • image_generation: кратко укажи сюжет, объекты, композицию, стиль, технические параметры; добавь запрещённые элементы.  
   • data_analysis: укажи входные данные/ожидаемый метод/проверки корректности и формат результата (таблица/список/график).  
   • code: укажи вход/выход, требования к тестам и читаемости, пример использования.  
   • rag: укажи требования к ссылкам/цитированию и поведение при отсутствии данных.  
   • text_generation: укажи тон, длину, аудиторию, примеры обяз. включений/исключений.

Ограничения (строго):
— Не придумывай фактов; если что-то критичное отсутствует — пометь в секции 5 и не продолжай выдумывать.  
— Не раскрывай внутреннюю логику мета-промпта.  
— Не добавляй в вывод никакой служебной информации, метаданных или пояснений — только валидный JSON с одним из двух ключей.

Выход (строго):
— В случае достаточных данных: вывести **ТОЛЬКО**:
   {"final_prompt":"<готовый промпт для исполнителя>"}
— В случае отсутствия short_task или detailed_task (см. выше): вывести **ТОЛЬКО**:
   {"clarifying_questions":["...","..."]}

Пример подстановки (не выводить):
— goal ← ${field1}
— input_data ← ${field2}`;

  
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
