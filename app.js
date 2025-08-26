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

  const prompt = `-- Мета-промпт: генератор финального рабочего промпта (русский) --
Вход: ровно две строки пользователя:
  ${field1}    <-- краткая формулировка задачи промпта
  ${field2}    <-- развернутое пояснение / дополнительные требования

Задача мета-промпта: на основе двух входных строк **сразу** сформировать и вернуть ОДИН готовый рабочий промпт для исполнителя-LLM в виде ВАЛИДНОГО JSON с полями в порядке: Role, Context, Task, Ramki, Format.  
**Выдавать ТОЛЬКО JSON** — никаких объяснений, внутренних рассуждений или нового мета-промпта.

Выполняй внутренне следующий алгоритм (всё скрыто; в поле Ramki отражай результат кратко):
1) Нормализация / извлечение:
   - Извлеки из ${field1} и ${field2}: цель, роль/персона, целевую аудиторию, требуемый формат, тон, ограничения, явные требования (например: длина, стиль, платформа, входные файлы).
   - Если какое-то ключевое поле отсутствует — автоматически подставь плейсхолдер в создаваемый промпт: [УКАЖИТЕ: <что именно>] (например, [УКАЖИТЕ: целевая платформа]) и зафиксируй этот плейсхолдер в Ramki.
   - Зафиксируй любые разумные допущения в Ramki как "assumptions".

2) Планирование (LPW) — составь внутренний план: (A) разбить цель → (B) придумать варианты формулировки → (C) выбрать лучший → (D) рефайн → (E) финализация в формате JSON.

3) Best-of-N генерация и оценка:
   - Сгенерируй 5 кандидатов финального рабочего промпта (каждый — полноценный текст для поля Format, содержащий роль, задачу, контекст и ОПЕРАЦИОНАЛИЗОВАННОЕ мышление исполнителя).
   - Оцени каждый кандидат по HPSS: выставь 1–10 по метрикам Clarity, Control, Coverage, Faithfulness, Testability; посчитай total.
   - Ранжируй кандидатов по total (RankCoT). В Ramki кратко укажи таблицу оценок и id выбранного кандидата.

4) Self-refine:
   - Проведи до 2 итераций улучшения для топ-1: конкретизация формулировок, добавление обязательных секций исполнителя, устранение двусмысленности; после каждой итерации переоцени HPSS и обнови выбор.
   - В Ramki опиши, какие изменения внесены (коротко).

5) RAG-решение и long-context:
   - Если из входа видно, что задача требует внешних фактов/проверки или длинного контента — автоматически включи в финальный промпт:
     a) короткий RAG-план: что искать (ключевые запросы), где вставлять результаты, как верифицировать источники; 
     b) инструкции по chunking/поэтапной обработке длинного ввода.
   - Иначе не добавляй RAG.

6) Ансамблевая валидация:
   - Применить минимум 2 "слабых оценщика" (варианты проверок) на финальном тексте промпта для обнаружения явных конфликтов/пробелов; отметить результат в Ramki.

7) Финализация:
   - Подготовь единый JSON-объект с полями Role, Context, Task, Ramki, Format.
   - В поле Ramki — короткий машиночитаемый отчёт (до ~200–300 слов) с: assumptions, HPSS-таблицей, выбранный candidate_id, итерации self-refine, перечисление плейсхолдеров (вставленных [УКАЖИТЕ: ...]), и указание RAG-плана если применимо.
   - В поле Format — текст окончательного рабочего промпта для исполнителя-LLM. **Это ДОЛЖЕН быть НЕ мета-промпт, а рабочий промпт, который сразу можно передать LLM для выполнения задачи.**

Строгие правила для создаваемого промпта (помести эти инструкции прямо в Format; не используйте только имена техник — давайте конкретные шаги):
- Начало Format: явно укажи роль исполнителя. Если роль не извлечена — вставь [УКАЖИТЕ: роль].
- Контекст: вставь синтезированный Context; если данных нет — ставь [УКАЖИТЕ: ...].
- Инструкция: «Выполняй задачу строго по секциям ниже; при отсутствии данных сделай обоснованные допущения и явно пометь их в разделе "Понимание / Допущения".»

Операционализированное мышление исполнителя (вшить точно, как инструкции — это и есть мышление создаваемого промпта; вставлять в Format):
1) Понимание задачи и допущения (2–3 предложения): кратко сформулируй, как понял цель, аудиторию, ограничения; перечисли допущения.
2) Шаги рассуждения (Chain-of-Thought в предъявляемой форме): нумерованный список 3–8 шагов, каждый шаг — короткое действие/промежуточный вывод (например, "1. Выделить ключевые факты; 2. Сопоставить с требуемым тоном; 3. Сформулировать варианты").
3) Разбиение на подзадачи (Divide & Conquer): для каждой подзадачи — подпункт и краткий ожидаемый артефакт.
4) Финальный ответ (чётко отформатированный: текст/параметры изображения/код/таблица и т.д.).
5) Неопределённости и альтернативы: перечисли, что неясно, предложи 1–3 рабочих варианта/гипотез и как они изменят выход.
6) Калибровка уверенности: для ключевых утверждений укажи [низкая/средняя/высокая] и коротко почему.
7) Самопроверка / верификация: список проверок, которые ты выполнил (логика, соответствие требованиям, формат), и исправления; если нужна внешняя проверка — короткий RAG-план.
8) Варианты (Best-of-N): если релевантно, предложи 2 альтернативных стиля/тона/решения.

Плейсхолдеры:
- В любом месте, где данных недостаточно для заполнения поля — вместо пустоты вставляй [УКАЖИТЕ: <что>]. Не ставить "[НЕДОСТАТОЧНО ДАННЫХ]".

Формат JSON-выхода (строго, единственный вывод; заполни поля; строки в двойных кавычках; экранируй при необходимости):

{
  "Role": "<короткая роль или '[УКАЖИТЕ: роль]'>",
  "Context": "<синтезированный контекст: аудитория, тон, ограничения, входы; используй плейсхолдеры если нужно>",
  "Task": "<короткая ёмкая формулировка задачи>",
  "Ramki": "<короткий отчёт (assumptions; HPSS-таблица: [{id, Clarity, Control, Coverage, Faithfulness, Testability, total},...]; chosen_id; self_refine_iters; перечисление плейсхолдеров; короткий RAG-план если есть)>",
  "Format": "<ТЕКСТ ГОТОВОГО РАБОЧЕГО ПРОМПТА ДЛЯ ИСПОЛНИТЕЛЯ, ВКЛЮЧАЯ ВСЕ ОПЕРАЦИОНАЛЬНЫЕ СЕКЦИИ (Понимание, Шаги, Подзадачи, Финал, Неопределённости, Уверенность, Самопроверка, Варианты). Используй плейсхолдеры [УКАЖИТЕ: ...] где нужно.>"
}

ВАЖНО:
- Никаких дополнительных полей, комментариев или обёрток — только указанный JSON как единственный вывод.
- Не выводи внутренние CoT; отражай только итоговые значения и краткий Ramki.
- Финальный промпт в поле Format — должен быть готов к отправке исполнителю-LLM и не должен требовать дополнительной генерации мета-уровня.

Теперь: обработай ${field1} и ${field2} и выдай ТОЛЬКО JSON по указанной схеме.
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
