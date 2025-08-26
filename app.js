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

  const prompt = `Ты — генератор промптов (фабрика промптов). Вход: ровно две строки пользователя:
  ${field1}  <-- краткая формулировка задачи промпта
  ${field2}  <-- развернутое пояснение задачи

Ты — генератор промптов (фабрика промптов). Вход: ровно две строки пользователя:
  ${field1}  <-- краткая формулировка задачи промпта
  ${field2}  <-- развернутое пояснение задачи

Задача: На основе этих двух строк **сформировать один конечный промпт** в виде строгого JSON-объекта с полями в порядке: Role, Context, Task, Constraints, Format.  
**Выводи ТОЛЬКО валидный JSON** (без пояснений, без рассуждений).

Требования к процессу генерации (выполняй внутренне, не показывая цепочки рассуждений):
1. Нормализуй и уточни вход: извлеки цель, целевую аудиторию, формат, ограничения, дополнительные данные из второй строки.
2. Планируй генерацию (пошагово): сформируй план действий по созданию промпта (логическая структура: цель → предпосылки → ожидаемый результат).
3. Сгенерируй 5 кандидатов финального промпта (каждый соответствует требуемой JSON-структуре полей, но с разными формулировками/углами подачи). (Best-of-N)
4. Оцени каждый кандидат по эвристике HPSS: давай для каждого баллы 1–10 по критериям — Чёткость (Clarity), Управляемость/Steerability (Control), Покрытие цели (Coverage), Достоверность/не выдумывание (Faithfulness), Тестируемость/Простота проверки (Testability). Сумма = total.
5. Выполни ранжирование кандидатов по total (RankCoT).  
6. Проведи до 2 итераций самоулучшения (self-refine): для топ-1 кандидата попробуй локальные улучшения (упрощение, конкретизация ограничений, добавление обязательных секций) и переоценку по HPSS; оставь лучший вариант.
7. Реши, нужен ли RAG/поиск: если из входа очевидно, что требуются внешние факты/проверка, врезь в итоговый промпт план поиска (что искать, где вставлять результаты, как верифицировать источники). Иначе не добавляй.
8. Итоговый вывод — **один** JSON, где поле `Constraints` содержит явные операционные инструкции (что сделано и что фабрика встроила), а поле `Format` — операционализированное мышление создаваемого промпта (обязательные секции для исполнителя).

Строгая схема JSON-выхода (заполни каждое поле; если данных не хватает — укажи явную пометку в соответствующем поле):

{
  "Role": "<короткая роль/персона, подходящая для задачи — например 'копирайтер', 'иллюстратор', 'аналитик' и т.д.>",
  "Context": "<конкретизированный контекст — извлечь из входа: аудитория, тон, ограничения, сырой вход/файлы/источники>",
  "Task": "<чёткая формулировка задачи (коротко), основанная на ${field1} и ${field2}>",
  "Constraints": "<Операционные рамки — это МЫШЛЕНИЕ МЕТА-ПРОМПТА (архитектор). Обязательно включи здесь:
     1) Краткий план (SR-FoT style): цель → предпосылки → ожидаемый результат.
     2) Что фабрика сделала: 'сгенерировано 5 кандидатов; оценены по шкале HPSS: {Clarity, Control, Coverage, Faithfulness, Testability} со значениями; выбран кандидат №X; выполнено N итераций самоулучшения (описать изменения коротко)'.
     3) Правила вставки мышления исполнителя в Format: 'встроить обязательные секции: Понимание, Шаги рассуждения, Подзадачи, Финал, Неопределённости, Уверенность, Самопроверка; при необходимости — RAG-план (где и что искать) и инструкции по разбиению длинного контента (chunking)'. 
     4) Явная команда-ограничение: 'выводить только запрошенные поля; если что-то нельзя заполнить — ставь \"[НЕДОСТАТОЧНО ДАННЫХ]\" в соответствующем разделе'.>",
  "Format": "<ЭТО И ЕСТЬ МЫШЛЕНИЕ СОЗДАВАЕМОГО ПРОМПТА (исполнитель), ОПЕРАЦИОНАЛИЗОВАННОЕ как обязательные секции. Обязательно структурируй так (и НИКАК иначе):
     1) Понимание задачи: 2–3 предложения — как промпт понял цель и ограничения.
     2) Шаги рассуждения: нумерованный список (Chain-of-Thought) — перечисли шаги, которые выполнишь, чтобы получить ответ.
     3) Решение по подзадачам: для каждой подзадачи (Divide & Conquer) — подпункт + краткий вывод.
     4) Основной ответ (финальный артефакт: пост, описание изображения, код, анализ и т.д.) — в требуемом формате.
     5) Неопределённости и альтернативы: перечисли, что неясно, и предложи 1–3 альтернативных варианта/гипотез.
     6) Калибровка уверенности: для ключевых утверждений укажи [низкая/средняя/высокая] и кратко почему.
     7) Самопроверка / Верификация: коротко опиши проверку ответов (ошибки, противоречия) и исправления; если требуется внешняя верификация — укажи RAG-план: что искать, какие запросы, как вставлять результаты.
     8) (Опционально) Варианты: если релевантно — предложи 2 альтернативных стиля/тона/решения (Best-of-N для исполнителя).
     Примечание: все секции должны быть заполнены; если что-то не применимо — укажи \"[НЕ ПРИМЕНИМО]\"; если данных недостаточно — укажи \"[НЕДОСТАТОЧНО ДАННЫХ]\" и предложи, что спросить у пользователя.)"
}

Дополнительные требования:
- Строго соблюдай JSON-синтаксис (кавычки, экранирование).  
- Никаких внешних комментариев, пояснений либо внутренних цепочек рассуждений в выводе — только JSON по указанной схеме.  
- Если вход короткий/неинформативный — заполни поля контекста максимально извлечённой информацией и в Constraints укажи, какие уточняющие вопросы нужно задать пользователю, чтобы улучшить промпт.

Теперь — обработай подставленные ${field1} и ${field2} и верни только JSON по указанной схеме.
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
