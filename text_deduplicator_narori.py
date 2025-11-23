class TextDeduplicator:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "input_text": ("STRING", {"multiline": False, "default": ""}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("output_text",)
    FUNCTION = "deduplicate"
    CATEGORY = "Narori工具箱"

    def deduplicate(self, input_text):
        # 处理空输入（更严格的空值检查）
        if not input_text or not input_text.strip():
            return ("",)
        
        # 1. 先整体去除首尾空白，避免边缘空格干扰
        processed_input = input_text.strip()
        
        # 2. 统一分割符：中英文逗号全部转为英文逗号，同时处理连续逗号（避免空元素）
        unified_text = processed_input.replace('，', ',')
        # 处理连续逗号（如",,,")为单个逗号，进一步减少空元素产生
        while ',,' in unified_text:
            unified_text = unified_text.replace(',,', ',')
        
        # 3. 分割并清洗元素：trim后过滤空值
        items = [item.strip() for item in unified_text.split(',') if item.strip()]
        
        # 4. 去重并保留原始顺序（增强型去重逻辑）
        seen = set()
        unique_items = []
        for item in items:
            # 针对可能的全角/半角空格、不可见字符等做额外处理
            normalized_item = item.replace('　', ' ').strip()  # 全角空格转半角并二次trim
            if normalized_item not in seen:
                seen.add(normalized_item)
                unique_items.append(item) 
        
        result = ','.join(unique_items)
        
        return (result,)

# 注册节点
NODE_CLASS_MAPPINGS = {
    "TextDeduplicator": TextDeduplicator
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "TextDeduplicator": "文本去重器🗂️"
}