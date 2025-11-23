import json
import os
import folder_paths
import comfy.sd
import comfy.utils

class EasyLoraLoader:
    @classmethod
    def INPUT_TYPES(cls):
        loras = ["None"] + folder_paths.get_filename_list("loras")
        return {
            "required": {
                "model": ("MODEL",),
                "clip": ("CLIP",),
                "lora_name": (loras,),
                "strength_model": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
                "strength_clip": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
            },
            "optional": {
                "string": ("STRING", {"forceInput": True}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "prompts_data": "STRING",
                "current_index": "INT"
            }
        }
    
    RETURN_TYPES = ("MODEL", "CLIP", "STRING")
    RETURN_NAMES = ("model", "clip", "prompt_string")
    FUNCTION = "load_lora"
    CATEGORY = "Narori工具箱"

    def __init__(self):
        self.loaded_lora = None

    def load_lora(self, model, clip, lora_name, strength_model, strength_clip, string="", 
                  unique_id=None, prompts_data=None, current_index=0):
        
        # 从param_selector获取当前选择的提示词
        current_prompt = ""
        try:
            if prompts_data:
                prompts = json.loads(prompts_data)
            else:
                prompts = {}
        except:
            prompts = {}
        
        prompt_items = list(prompts.values())
        
        if prompt_items and current_index < len(prompt_items):
            current_prompt = prompt_items[current_index]
        
        # 智能拼接提示词字符串
        prev_stripped = string.strip() if string else ""
        current_stripped = current_prompt.strip() if current_prompt else ""
        
        if prev_stripped and current_stripped:
            # 检查上一个字符串是否以逗号结尾
            if prev_stripped.endswith(','):
                # 已有逗号，直接加空格和当前提示词
                combined_prompt = prev_stripped + " " + current_stripped
            else:
                # 没有逗号，添加逗号和空格
                combined_prompt = prev_stripped + ", " + current_stripped
        elif current_stripped:
            # 如果只有当前提示词
            combined_prompt = current_stripped
        else:
            # 如果当前提示词为空，只使用前一个
            combined_prompt = prev_stripped
        
        # 输出前，trim掉最右边的逗号（如果有）
        combined_prompt = combined_prompt.rstrip(',').rstrip()
        
        # 如果选择了"None"或者强度为0，直接返回原始model和clip
        if lora_name == "None" or (strength_model == 0 and strength_clip == 0):
            return (model, clip, combined_prompt)
        
        # 加载LoRA
        lora_path = folder_paths.get_full_path("loras", lora_name)
        lora = None
        
        if self.loaded_lora is not None:
            if self.loaded_lora[0] == lora_path:
                lora = self.loaded_lora[1]
            else:
                temp = self.loaded_lora
                self.loaded_lora = None
                del temp
        
        if lora is None:
            lora = comfy.utils.load_torch_file(lora_path, safe_load=True)
            self.loaded_lora = (lora_path, lora)
        
        # 应用LoRA
        model_lora, clip_lora = comfy.sd.load_lora_for_models(model, clip, lora, strength_model, strength_clip)
        
        return (model_lora, clip_lora, combined_prompt)
    
    @classmethod
    def IS_CHANGED(cls, unique_id=None, prompts_data=None, current_index=0, **kwargs):
        return f"{prompts_data}_{current_index}"

NODE_CLASS_MAPPINGS = {
    "NaroriEasyLoraLoader": EasyLoraLoader,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "NaroriEasyLoraLoader": "简易Lora加载器 🎨",
}
