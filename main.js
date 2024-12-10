console.log("API is ready!");

function getUserAndDomain() {
  const addr = $(".random-mail-box").val();
  if (!addr) {
    alert("Please generate or input an email address first!");
    return null;
  }
  const [user, domain] = addr.split("@");
  return { user, domain };
}

function setEmail() {
  const inputBox = document.querySelector(".mail-box");
  const textBox = document.querySelector(".random-mail-box");
  const suffixSelect = document.getElementById("suffix");
  const emailIdsDiv = $("#emailIds");
  const emailContent = document.getElementById("emailContent");

  const inputValue = inputBox.value.trim();
  const selectedSuffix = suffixSelect.value;

  if (inputValue === "" || selectedSuffix === "") {
    alert("Please enter a valid input and select a suffix.");
    return;
  }

  textBox.value = inputValue + selectedSuffix;
  inputBox.value = "";
  suffixSelect.value = "";

  emailIdsDiv.empty();
  emailContent.innerHTML = "";
}

function genEmail() {
  const textBox = document.querySelector(".random-mail-box");
  const emailIdsDiv = $("#emailIds");
  const emailContent = document.getElementById("emailContent");

  $.getJSON(
    "https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1",
    (res) => {
      const randomEmail = res[0];
      textBox.value = randomEmail;

      emailIdsDiv.empty();
      emailContent.innerHTML = "";

      refreshMail();
    }
  );
}

function refreshMail() {
  const { user, domain } = getUserAndDomain();

  if (!user || !domain) return;

  $.getJSON(
    `https://www.1secmail.com/api/v1/?action=getMessages&login=${user}&domain=${domain}`,
    (emails) => {
      const emailIdsDiv = $("#emailIds");
      emailIdsDiv.empty();

      for (const email of emails) {
        const emailIdElement = `<div class="email-id" onclick="displayEmailContent('${email.id}')">${email.id}</div>`;
        emailIdsDiv.prepend(emailIdElement);
      }
    }
  );
}

function displayEmailContent(emailId) {
  selectedEmailId = emailId;
  refreshMail();

  const { user, domain } = getUserAndDomain();

  if (!user || !domain) return;

  const emailContent = document.getElementById("emailContent");
  emailContent.innerHTML = "Loading...";

  $.getJSON(
    `https://www.1secmail.com/api/v1/?action=readMessage&login=${user}&domain=${domain}&id=${emailId}`,
    (email) => {
      const newEmailContent = document.getElementById("emailContent");

      if (newEmailContent) {
        newEmailContent.innerHTML = "";
      }

      if (email) {
        const emailDate = new Date(email.date);

        const indianTimeOffset = 330;
        const indianTime = new Date(
          emailDate.getTime() + indianTimeOffset * 60 * 1000
        );

        const options = {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        };
        const formattedDate = indianTime.toLocaleString("en-IN", options);

        const convertedEmail = {
          ...email,
          date: formattedDate,
        };

        newEmailContent.innerHTML = `  
            <div class="content-titles"><b>From:</b> ${
              convertedEmail.from
            }</div>  
            <div class="content-titles"><b>Subject:</b> ${
              convertedEmail.subject
            }</div>  
            <div class="content-titles"><b>Date:</b> ${
              convertedEmail.date
            }</div>  
            <div class="content-body">${
              convertedEmail.htmlBody || convertedEmail.body
            }</div>  
          `;
      } else {
        newEmailContent.innerHTML = `  
            <div class="message">  
              <span class="icon" aria-hidden="true">&#9888;</span>  
              Email content is not available.  
            </div>  
          `;
      }
    }
  );
}

function loadEmail(id) {
  const { user, domain } = getUserAndDomain();

  if (!user || !domain) return;

  $.getJSON(
    `https://www.1secmail.com/api/v1/?action=readMessage&login=${user}&domain=${domain}&id=${id}`,
    (email) => {
      const elm = $(`#${id}`);
      if (email.htmlBody) {
        elm.html(email.htmlBody);
      } else {
        elm.text(email.body);
      }

      const atts = $("<div></div>");
      for (const file of email.attachments) {
        atts.append(
          `<a href='https://www.1secmail.com/api/v1/?action=download&login=${user}&domain=${domain}&id=${id}&file=${file.filename}'>${file.filename}</a>`
        );
      }
      elm.append(atts);
    }
  );
}

function copyEmail() {
  const textBox = document.querySelector(".random-mail-box");
  textBox.select();
  document.execCommand("copy");

  const tooltip = document.getElementById("copyTooltip");
  tooltip.innerHTML = "Copied!";
  tooltip.style.visibility = "visible";

  setTimeout(() => {
    tooltip.style.visibility = "hidden";
  }, 2000);
}

function startAutoRefresh() {
  setInterval(refreshMail, 5000);
}

$(document).ready(function () {
  $("#setBtn").click(function () {
    setEmail();
  });

  $("#randomBtn").click(function () {
    genEmail();
  });

  $("#refreshBtn").click(function () {
    refreshMail();
  });

  $("#copyBtn").click(function () {
    copyEmail();
  });

  genEmail();
  startAutoRefresh();
});
