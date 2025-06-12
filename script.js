document.addEventListener("DOMContentLoaded", () => {
  const imageUpload = document.getElementById("imageUpload");
  const uploadedImage = document.getElementById("uploadedImage");
  const submitBtn = document.getElementById("submitBtn");
  const uploadSection = document.getElementById("upload-section");
  const resultSection = document.getElementById("result-section");
  const resultFilename = document.getElementById("resultFilename");
  const detectedObjectsList = document.getElementById("detectedObjectsList");
  const resultCanvas = document.getElementById("resultCanvas");
  const backBtn = document.getElementById("backBtn");

  let uploadedFile = null;

  imageUpload.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      uploadedFile = file;
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadedImage.src = e.target.result;
        uploadedImage.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      uploadedImage.style.display = "none";
      uploadedFile = null;
    }
  });

  submitBtn.addEventListener("click", async () => {
    if (!uploadedFile) {
      alert("Please select an image first.");
      return;
    }

    const apiUrl =
      "https://telkom-ai-dag.api.apilogy.id/Object_Detection/0.0.1/v1"; // Endpoint API
    const API_KEY = "API_KEY"; //Gunakan API Key yang telah di generate dari APILOGY
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-api-key": API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const apiResult = await response.json();
      displayResult(apiResult);
    } catch (error) {
      console.error("Error submitting image to API:", error);
      alert(
        "Failed to get API response. Please check the console for details."
      );
    }
  });

  backBtn.addEventListener("click", () => {
    resultSection.style.display = "none";
    uploadSection.style.display = "block";
    uploadedImage.style.display = "none";
    imageUpload.value = "";
    uploadedFile = null;
    clearResultDisplay();
  });

  function displayResult(result) {
    uploadSection.style.display = "none";
    resultSection.style.display = "block";

    resultFilename.textContent = result.filename;
    detectedObjectsList.innerHTML = "";

    const img = new Image();
    img.onload = () => {
      const ctx = resultCanvas.getContext("2d");
      resultCanvas.width = img.width;
      resultCanvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      result.data.forEach((item) => {
        for (const objectName in item) {
          const obj = item[objectName];
          const [p1, p2] = obj.bbox;
          const x1 = Math.min(p1[0], p2[0]);
          const y1 = Math.min(p1[1], p2[1]);
          const x2 = Math.max(p1[0], p2[0]);
          const y2 = Math.max(p1[1], p2[1]);
          const width = x2 - x1;
          const height = y2 - y1;
          const confScore = obj.conf_score;

          // Draw bounding box
          ctx.beginPath();
          ctx.rect(x1, y1, width, height);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "red";
          ctx.stroke();

          // Draw label
          ctx.fillStyle = "red";
          ctx.font = "20px Arial";
          ctx.fillText(
            `${objectName} (${(confScore * 100).toFixed(2)}%)`,
            x1 + 5,
            y1 + 25
          );

          // Add to list
          const listItem = document.createElement("li");
          listItem.textContent = `${objectName}: Confidence - ${(
            confScore * 100
          ).toFixed(2)}%, BBox - [${x1}, ${y1}] [${x2}, ${y2}]`;
          detectedObjectsList.appendChild(listItem);
        }
      });
    };
    img.src = uploadedImage.src; // Use the already uploaded image for drawing
  }

  function clearResultDisplay() {
    resultFilename.textContent = "";
    detectedObjectsList.innerHTML = "";
    const ctx = resultCanvas.getContext("2d");
    ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
    resultCanvas.width = 0; // Reset canvas size
    resultCanvas.height = 0;
  }
});
