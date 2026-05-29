import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UpdateProfile {
    public static void main(String[] args) throws IOException {
        String homePath = "backend/src/main/resources/templates/client/home.html";
        String profilePath = "backend/src/main/resources/templates/client/profile.html";
        
        String homeContent = new String(Files.readAllBytes(Paths.get(homePath)), "UTF-8");
        String profileContent = new String(Files.readAllBytes(Paths.get(profilePath)), "UTF-8");
        
        // Extract post HTML from home (the big div th:each)
        Pattern postPattern = Pattern.compile("<div th:each=\"post : \\$\\{recentPosts\\}\" class=\"poly-card p-0 mt-3\">.*?<script>", Pattern.DOTALL);
        Matcher m = postPattern.matcher(homeContent);
        if(!m.find()) {
            System.out.println("Failed to find post block in home.html");
            return;
        }
        
        String postHtml = m.group(0).replace("<script>", "").replace("class=\"poly-card p-0 mt-3\"", "class=\"poly-card p-0 mb-3\"");
        
        // Find profile post block
        Pattern profilePostPattern = Pattern.compile("<div th:each=\"post : \\$\\{recentPosts\\}\" class=\"poly-card p-0 mb-3\">.*?<!-- Nếu không có bài viết -->", Pattern.DOTALL);
        profileContent = profilePostPattern.matcher(profileContent).replaceFirst( Matcher.quoteReplacement(postHtml) + "\n                        <!-- Nếu không có bài viết -->" );
        
        // Extract script from home
        Pattern scriptPattern = Pattern.compile("<script>(.*?)</script>", Pattern.DOTALL);
        Matcher sm = scriptPattern.matcher(homeContent);
        StringBuilder scripts = new StringBuilder();
        while(sm.find()) {
            String script = sm.group(1);
            if(!script.contains("showMajorPopup")) {
                scripts.append("\n<script>\n").append(script).append("\n</script>\n");
            }
        }
        
        profileContent = profileContent.replace("</div>\n        </div>\n    </div>\n</body>", "</div>\n        </div>\n    </div>\n" + scripts.toString() + "\n</body>");
        
        Files.write(Paths.get(profilePath), profileContent.getBytes("UTF-8"));
        System.out.println("Success updating profile");
    }
}