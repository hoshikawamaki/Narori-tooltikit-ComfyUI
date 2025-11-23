import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "Narori.PromptSelector",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "NaroriPromptSelector") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function() {
                const result = onNodeCreated?.apply(this, arguments);
                
                const promptsWidget = this.addWidget("text", "prompts_data", JSON.stringify({"默认": "masterpiece, best quality"}), () => {}, {serialize: true});
                const indexWidget = this.addWidget("number", "current_index", 0, () => {}, {min: 0, max: 9, serialize: true});
                
                const hideWidget = (widget) => {
                    widget.computeSize = () => [0, -4];
                    widget.serializeValue = async (node, index) => widget.value;
                    widget.draw = function() {};
                };
                
                hideWidget(promptsWidget);
                hideWidget(indexWidget);
                
                this.addCustomWidget({
                    name: "prompt_selector_row",
                    draw: function(ctx, node, widgetWidth, y, widgetHeight) {
                        const margin = 15;
                        const arrowSize = 8;
                        const arrowPadding = 10;
                        const totalArrowWidth = arrowSize + arrowPadding * 2;
                        const gearButtonSize = 24;
                        const gearGap = 8;
                        const selectorStartX = margin + gearButtonSize + gearGap;
                        const selectorWidth = widgetWidth - selectorStartX - margin;
                        const displayWidth = selectorWidth - 2 * totalArrowWidth;
                        
                        const bgColor = "#222";
                        const borderColor = "#555";
                        const textColor = "#ddd";
                        const gearBgColor = "#333";
                        const gearBorderColor = "#666";
                        const borderRadius = 4;
                        
                        let prompts = {};
                        let keys = [];
                        let currentIndex = 0;
                        try {
                            prompts = JSON.parse(promptsWidget.value);
                            keys = Object.keys(prompts);
                            currentIndex = indexWidget.value;
                        } catch(e) {}
                        
                        const canGoPrev = keys.length > 1;
                        const canGoNext = keys.length > 1;
                        const leftArrowColor = canGoPrev ? "#ddd" : "#555";
                        const rightArrowColor = canGoNext ? "#ddd" : "#555";
                        
                        ctx.fillStyle = gearBgColor;
                        ctx.beginPath();
                        ctx.roundRect(margin, y + (widgetHeight - gearButtonSize) / 2, gearButtonSize, gearButtonSize, borderRadius);
                        ctx.fill();
                        ctx.strokeStyle = gearBorderColor;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        
                        ctx.fillStyle = "#aaa";
                        ctx.font = "16px sans-serif";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText("⚙", margin + gearButtonSize / 2, y + widgetHeight / 2);
                        
                        ctx.fillStyle = bgColor;
                        ctx.beginPath();
                        ctx.roundRect(selectorStartX, y, selectorWidth, widgetHeight, borderRadius);
                        ctx.fill();
                        ctx.strokeStyle = borderColor;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        
                        ctx.fillStyle = leftArrowColor;
                        ctx.beginPath();
                        ctx.moveTo(selectorStartX + arrowPadding, y + widgetHeight / 2);
                        ctx.lineTo(selectorStartX + arrowPadding + arrowSize, y + widgetHeight / 2 - arrowSize / 2);
                        ctx.lineTo(selectorStartX + arrowPadding + arrowSize, y + widgetHeight / 2 + arrowSize / 2);
                        ctx.closePath();
                        ctx.fill();
                        
                        ctx.fillStyle = textColor;
                        ctx.font = "12px sans-serif";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        let displayText = "默认";
                        if (keys.length > 0 && currentIndex < keys.length) {
                            displayText = keys[currentIndex];
                        }
                        
                        const maxWidth = displayWidth - 20;
                        const textWidth = ctx.measureText(displayText).width;
                        if (textWidth > maxWidth) {
                            let truncated = displayText;
                            while (ctx.measureText(truncated + "...").width > maxWidth && truncated.length > 0) {
                                truncated = truncated.slice(0, -1);
                            }
                            displayText = truncated + "...";
                        }
                        
                        ctx.fillText(displayText, selectorStartX + totalArrowWidth + displayWidth / 2, y + widgetHeight / 2);
                        
                        ctx.fillStyle = rightArrowColor;
                        ctx.beginPath();
                        const rightArrowX = selectorStartX + totalArrowWidth + displayWidth + arrowPadding;
                        ctx.moveTo(rightArrowX + arrowSize, y + widgetHeight / 2);
                        ctx.lineTo(rightArrowX, y + widgetHeight / 2 - arrowSize / 2);
                        ctx.lineTo(rightArrowX, y + widgetHeight / 2 + arrowSize / 2);
                        ctx.closePath();
                        ctx.fill();
                        
                        return widgetHeight;
                    },
                    mouse: function(event, pos, node) {
                        const margin = 15;
                        const arrowPadding = 10;
                        const arrowSize = 8;
                        const totalArrowWidth = arrowSize + arrowPadding * 2;
                        const gearButtonSize = 24;
                        const gearGap = 8;
                        const selectorStartX = margin + gearButtonSize + gearGap;
                        const selectorWidth = node.size[0] - selectorStartX - margin;
                        
                        if (event.type === "pointerdown") {
                            if (pos[0] >= margin && pos[0] <= margin + gearButtonSize) {
                                node.showConfigDialog(promptsWidget, indexWidget);
                                return true;
                            } else if (pos[0] >= selectorStartX && pos[0] <= selectorStartX + totalArrowWidth) {
                                try {
                                    const prompts = JSON.parse(promptsWidget.value);
                                    const keys = Object.keys(prompts);
                                    if (keys.length > 1) {
                                        indexWidget.value = (indexWidget.value - 1 + keys.length) % keys.length;
                                        node.setDirtyCanvas(true, true);
                                    }
                                } catch(e) {
                                    console.error("解析prompts失败:", e);
                                }
                                return true;
                            } else if (pos[0] >= selectorStartX + selectorWidth - totalArrowWidth && 
                                       pos[0] <= selectorStartX + selectorWidth) {
                                try {
                                    const prompts = JSON.parse(promptsWidget.value);
                                    const keys = Object.keys(prompts);
                                    if (keys.length > 1) {
                                        indexWidget.value = (indexWidget.value + 1) % keys.length;
                                        node.setDirtyCanvas(true, true);
                                    }
                                } catch(e) {
                                    console.error("解析prompts失败:", e);
                                }
                                return true;
                            }
                        }
                        return false;
                    },
                    computeSize: function(width) {
                        return [width, 28];
                    }
                });
                
                this.setSize(this.computeSize());
                
                this.showConfigDialog = (promptsWidget, indexWidget) => {
                    let prompts = {};
                    try {
                        prompts = JSON.parse(promptsWidget.value);
                    } catch(e) {
                        prompts = {"默认": "masterpiece, best quality"};
                    }
                    
                    const dialog = document.createElement("div");
                    dialog.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2b2b2b;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.5);z-index:10000;min-width:600px;max-width:80vw;max-height:80vh;overflow:auto;";
                    
                    dialog.innerHTML = `
                        <h3 style="margin:0 0 15px 0;color:#fff;font-size:18px;">📋 提示词配置管理</h3>
                        <div style="margin-bottom:15px;overflow-y:auto;max-height:400px;">
                            <table id="promptTable" style="width:100%;border-collapse:collapse;color:#fff;">
                                <thead style="position:sticky;top:0;background:#2b2b2b;">
                                    <tr style="background:#404040;">
                                        <th style="padding:8px;border:1px solid #555;text-align:left;">名称</th>
                                        <th style="padding:8px;border:1px solid #555;text-align:left;">提示词内容</th>
                                        <th style="padding:8px;border:1px solid #555;width:80px;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="promptTableBody"></tbody>
                            </table>
                        </div>
                        <button id="addRowBtn" style="padding:8px 15px;background:#4a9eff;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">➕ 添加行</button>
                        <button id="saveBtn" style="padding:8px 15px;background:#22c55e;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">💾 保存配置</button>
                        <button id="cancelBtn" style="padding:8px 15px;background:#ef4444;color:#fff;border:none;border-radius:4px;cursor:pointer;">✖️ 取消</button>
                    `;
                    
                    document.body.appendChild(dialog);
                    
                    const overlay = document.createElement("div");
                    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;";
                    document.body.insertBefore(overlay, dialog);
                    
                    const tbody = dialog.querySelector("#promptTableBody");
                    
                    const renderTable = () => {
                        tbody.innerHTML = "";
                        Object.entries(prompts).forEach(([name, prompt], index) => {
                            const row = document.createElement("tr");
                            row.style.background = index % 2 === 0 ? "#333" : "#2b2b2b";
                            const escapedName = name.replace(/"/g, '&quot;');
                            const escapedPrompt = prompt.replace(/"/g, '&quot;');
                            row.innerHTML = `
                                <td style="padding:8px;border:1px solid #555;">
                                    <input type="text" value="${escapedName}" style="width:100%;background:#1a1a1a;color:#fff;border:1px solid #555;padding:4px;border-radius:3px;" data-type="name" data-oldname="${escapedName}">
                                </td>
                                <td style="padding:8px;border:1px solid #555;">
                                    <input type="text" value="${escapedPrompt}" style="width:100%;background:#1a1a1a;color:#fff;border:1px solid #555;padding:4px;border-radius:3px;" data-type="prompt" data-name="${escapedName}">
                                </td>
                                <td style="padding:8px;border:1px solid #555;text-align:center;">
                                    <button data-delete="${escapedName}" style="padding:4px 10px;background:#ef4444;color:#fff;border:none;border-radius:3px;cursor:pointer;">删除</button>
                                </td>
                            `;
                            tbody.appendChild(row);
                        });
                    };
                    
                    renderTable();
                    
                    dialog.querySelector("#addRowBtn").onclick = () => {
                        const newName = `新提示词${Object.keys(prompts).length + 1}`;
                        prompts[newName] = "";
                        renderTable();
                    };
                    
                    tbody.addEventListener("click", (e) => {
                        if (e.target.hasAttribute("data-delete")) {
                            const keyToDelete = e.target.getAttribute("data-delete");
                            delete prompts[keyToDelete];
                            renderTable();
                        }
                    });
                    
                    dialog.querySelector("#saveBtn").onclick = () => {
                        const newPrompts = {};
                        const nameInputs = tbody.querySelectorAll("input[data-type='name']");
                        const promptInputs = tbody.querySelectorAll("input[data-type='prompt']");
                        
                        nameInputs.forEach((nameInput, index) => {
                            const name = nameInput.value.trim();
                            const prompt = promptInputs[index].value;
                            if (name) {
                                newPrompts[name] = prompt;
                            }
                        });
                        
                        promptsWidget.value = JSON.stringify(newPrompts);
                        
                        const keys = Object.keys(newPrompts);
                        if (indexWidget.value >= keys.length) {
                            indexWidget.value = Math.max(0, keys.length - 1);
                        }
                        
                        this.setDirtyCanvas(true, true);
                        
                        document.body.removeChild(overlay);
                        document.body.removeChild(dialog);
                    };
                    
                    dialog.querySelector("#cancelBtn").onclick = () => {
                        document.body.removeChild(overlay);
                        document.body.removeChild(dialog);
                    };
                    
                    overlay.onclick = () => {
                        document.body.removeChild(overlay);
                        document.body.removeChild(dialog);
                    };
                };
                
                return result;
            };
        }
    }
});


