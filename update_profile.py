import re

with open('h:\\DA_PolyHUb\\polyhub\\polyhub\\src\\main\\resources\\templates\\client\\home.html', 'r', encoding='utf-8') as f:
    home_content = f.read()

# Extract post block from home.html
post_pattern = re.compile(r'<div th:each="post : \$\{recentPosts\}".*?<!-- Vùng chứa Bình Luận \(Mặc định ẩn\) -->.*?</div>\s*</div>', re.DOTALL)
post_match = post_pattern.search(home_content)

if post_match:
    post_html = post_match.group(0).replace('mt-3', 'mb-3') # profile uses mb-3
    
# Extract scripts from home.html
script_pattern = re.compile(r'<script>(.*?)</script>', re.DOTALL)
scripts = script_pattern.findall(home_content)
# We want the scripts that define togglePostPrivacy, deletePost, etc.
# Usually there are two scripts or one big one. Let's get the big one.
main_script = ""
for s in scripts:
    if 'deletePost' in s and 'togglePostPrivacy' in s:
        main_script = s
        break
    if 'document.addEventListener(\'DOMContentLoaded\', function()' in s:
        # maybe the first big script contains it all? Let's just concatenate everything if it doesn't have bootstrap modal only stuff.
        pass

# let's just grab all <script> ... </script> blocks EXCEPT the one throwing showMajorPopup to avoid conflicts
all_scripts_pattern = re.compile(r'(<script>.*?</script>)', re.DOTALL)
all_scripts = all_scripts_pattern.findall(home_content)
final_scripts = "\n".join([s for s in all_scripts if 'showMajorPopup' not in s])

# Now read profile.html
with open('h:\\DA_PolyHUb\\polyhub\\polyhub\\src\\main\\resources\\templates\\client\\profile.html', 'r', encoding='utf-8') as f:
    profile_content = f.read()

# Replace post block in profile.html
profile_post_pattern = re.compile(r'<div th:each="post : \$\{recentPosts\}".*?<!-- Nếu không có bài viết -->', re.DOTALL)

def replacer(match):
    return post_html + '\n\n                        <!-- Nếu không có bài viết -->'

profile_content = profile_post_pattern.sub(replacer, profile_content)

# Add scripts at the end before </body>
profile_content = profile_content.replace('</body>', f'{final_scripts}\n</body>')

with open('h:\\DA_PolyHUb\\polyhub\\polyhub\\src\\main\\resources\\templates\\client\\profile.html', 'w', encoding='utf-8') as f:
    f.write(profile_content)

print("Done updating profile.html")