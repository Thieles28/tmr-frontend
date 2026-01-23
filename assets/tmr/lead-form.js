document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://tmr-backend.onrender.com/leads";

    const form = document.querySelector("form.mbr-form.form-with-styler");
    if (!form) return console.error("TMR: form não encontrado");

    const btn = form.querySelector(".mbr-section-btn button.btn");
    if (!btn) return console.error("TMR: botão não encontrado");

    const successAlert = form.querySelector("[data-form-alert]");
    const errorAlert = form.querySelector("[data-form-alert-danger]");

    const nameInput = form.querySelector("#name-form02-6");
    const emailInput = form.querySelector("#email-form02-6");
    const phoneInput = form.querySelector("#phone-form02-6");
    const messageInput = form.querySelector("#textarea-form02-6");

    phoneInput?.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
        else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
        else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
        else if (value.length > 0) value = value.replace(/^(\d{0,2})$/, "($1");

        e.target.value = value;
    });

    let alertTimer = null;
    const normalizeText = (v) => String(v ?? "").trim();
    const normalizeEmail = (v) =>
        String(v ?? "").trim().toLowerCase().replace(/\s+/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "");
    const normalizePhone = (v) => String(v ?? "").trim().replace(/\D+/g, "");

    function hideAlerts() {
        if (alertTimer) clearTimeout(alertTimer);
        if (successAlert) successAlert.hidden = true;
        if (errorAlert) errorAlert.hidden = true;
    }

    function scheduleHideAlerts(ms) {
        if (alertTimer) clearTimeout(alertTimer);
        alertTimer = setTimeout(hideAlerts, ms);
    }

    function showSuccess(msg) {
        if (!successAlert) return;
        successAlert.textContent = msg || "Mensagem enviada com sucesso. Em breve entraremos em contato.";
        successAlert.hidden = false;
        scheduleHideAlerts(6000);
    }

    function showError(msg) {
        if (!errorAlert) return;
        errorAlert.textContent = msg || "Não foi possível enviar sua mensagem. Tente novamente mais tarde.";
        errorAlert.hidden = false;
        scheduleHideAlerts(8000);
    }

    function toggleButtonIfHasContent() {
        const hasAllValues =
            nameInput?.value.trim() &&
            emailInput?.value.trim() &&
            phoneInput?.value.trim() &&
            messageInput?.value.trim().length > 10;

        btn.disabled = !hasAllValues;
    }

    [nameInput, emailInput, phoneInput, messageInput].forEach((el) => {
        el.addEventListener("input", toggleButtonIfHasContent);
        el.addEventListener("change", toggleButtonIfHasContent);
    });

    btn.disabled = true;
    toggleButtonIfHasContent();

    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideAlerts();

        const payload = {
            name: normalizeText(nameInput?.value),
            email: normalizeEmail(emailInput?.value),
            phone: normalizePhone(phoneInput?.value),
            message: normalizeText(messageInput?.value),
        };

        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Enviando...";

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok || json.success === false) {
                const msg =
                    json?.message ||
                    json?.issues?.[0]?.message ||
                    "Erro ao enviar. Verifique os dados e tente novamente.";
                throw new Error(msg);
            }

            showSuccess(json.message);
            form.reset();
        } catch (err) {
            showError(err?.message);
        } finally {
            btn.disabled = false;
            btn.textContent = oldText;
        }
    });
});