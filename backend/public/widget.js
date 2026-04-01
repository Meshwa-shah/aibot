(function () {
  const script = document.currentScript;
  const companyId = script.getAttribute("data-company-id");

  const container = document.createElement("div");
  container.id = "chatbot-widget";
  document.body.appendChild(container);

  const button = document.createElement("button");
  button.innerText = "💬";
  button.style.position = "fixed";
  button.style.bottom = "20px";
  button.style.right = "20px";
  button.style.zIndex = "9999";
  button.style.padding = "12px";
  button.style.borderRadius = "50%";
  button.style.background = "#6366f1";
  button.style.color = "white";
  button.style.border = "none";
  button.style.cursor = "pointer";

  document.body.appendChild(button);

  const iframe = document.createElement("iframe");
  iframe.src = `${process.env.BACK_URL}/chat?company=${companyId}`;
  iframe.style.position = "fixed";
  iframe.style.bottom = "80px";
  iframe.style.right = "20px";
  iframe.style.width = "350px";
  iframe.style.height = "500px";
  iframe.style.border = "none";
  iframe.style.borderRadius = "12px";
  iframe.style.display = "none";
  iframe.style.zIndex = "9999";

  document.body.appendChild(iframe);

  button.onclick = () => {
    iframe.style.display =
      iframe.style.display === "none" ? "block" : "none";
  };
})