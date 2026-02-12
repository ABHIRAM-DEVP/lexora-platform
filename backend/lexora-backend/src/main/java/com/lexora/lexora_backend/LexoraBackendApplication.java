package com.lexora.lexora_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import io.github.cdimascio.dotenv.Dotenv;

//mvn spring-boot:run -DskipTests
//u1-admin, //u2-owner
@SpringBootApplication
@EnableConfigurationProperties
@EnableTransactionManagement
public class LexoraBackendApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.load();
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		SpringApplication.run(LexoraBackendApplication.class, args);
	}

}



//formula codes 
// 1️⃣ Controller (Short Template)
// @RestController
// @RequestMapping("/api/{resource}")
// @RequiredArgsConstructor
// public class {Resource}Controller {

//     private final {Resource}Service {resource}Service;

//     // CREATE
//     @PostMapping
//     public ResponseEntity<?> create{Resource}(@RequestBody Create{Resource}Request request, @RequestParam Long userId) {
//         User user = getUserById(userId); // custom helper
//         return ResponseEntity.status(HttpStatus.CREATED)
//                 .body({resource}Service.create{Resource}(user, request));
//     }

//     // LIST / GET
//     @GetMapping
//     public ResponseEntity<?> list{Resource}s(@RequestParam Long userId,
//                                              @RequestParam(required=false) Long workspaceId,
//                                              @RequestParam(defaultValue="0") int page,
//                                              @RequestParam(defaultValue="10") int size) {
//         User user = getUserById(userId);
//         return ResponseEntity.ok({resource}Service.get{Resource}s(user, workspaceId, page, size));
//     }

//     // GET BY ID
//     @GetMapping("/{id}")
//     public ResponseEntity<?> get{Resource}(@RequestParam Long userId, @PathVariable Long id) {
//         User user = getUserById(userId);
//         return ResponseEntity.ok({resource}Service.get{Resource}ById(user, id));
//     }

//     // UPDATE
//     @PutMapping("/{id}")
//     public ResponseEntity<?> update{Resource}(@RequestParam Long userId, @PathVariable Long id, @RequestBody Update{Resource}Request request) {
//         User user = getUserById(userId);
//         return ResponseEntity.ok({resource}Service.update{Resource}(user, id, request));
//     }

//     // DELETE
//     @DeleteMapping("/{id}")
//     public ResponseEntity<?> delete{Resource}(@RequestParam Long userId, @PathVariable Long id) {
//         User user = getUserById(userId);
//         {resource}Service.delete{Resource}(user, id);
//         return ResponseEntity.ok(Map.of("message", "{Resource} deleted"));
//     }

//     // Helper to fetch user (from DB or context)
//     private User getUserById(Long id) {
//         return userService.getById(id); // implement in UserService
//     }
// }

// 2️⃣ Service (Short Template)
// @Service
// @RequiredArgsConstructor
// public class {Resource}Service {

//     private final {Resource}Repository {resource}Repository;
//     private final WorkspaceRepository workspaceRepository;

//     public {Resource} create{Resource}(User user, Create{Resource}Request request) {
//         Workspace workspace = workspaceRepository.findById(request.getWorkspaceId())
//                 .orElseThrow(() -> new RuntimeException("Workspace not found"));

//         if (!workspace.getOwner().getId().equals(user.getId())) {
//             throw new RuntimeException("Access denied");
//         }

//         {Resource} entity = new {Resource}();
//         entity.setTitle(request.getTitle());
//         entity.setContent(request.getContent());
//         entity.setWorkspace(workspace);
//         return {resource}Repository.save(entity);
//     }

//     public List<{Resource}> get{Resource}s(User user, Long workspaceId, int page, int size) {
//         PageRequest pageable = PageRequest.of(page, size);
//         if (workspaceId != null) {
//             Workspace ws = workspaceRepository.findById(workspaceId)
//                     .orElseThrow(() -> new RuntimeException("Workspace not found"));
//             if (!ws.getOwner().getId().equals(user.getId())) throw new RuntimeException("Access denied");
//             return {resource}Repository.findByWorkspaceAndDeletedFalse(ws, pageable);
//         }
//         return {resource}Repository.findByWorkspaceOwnerAndDeletedFalse(user, pageable);
//     }

//     public {Resource} get{Resource}ById(User user, Long id) {
//         {Resource} entity = {resource}Repository.findById(id)
//                 .orElseThrow(() -> new RuntimeException("{Resource} not found"));
//         if (!entity.getWorkspace().getOwner().getId().equals(user.getId())) throw new RuntimeException("Access denied");
//         return entity;
//     }

//     public {Resource} update{Resource}(User user, Long id, Update{Resource}Request request) {
//         {Resource} entity = get{Resource}ById(user, id);
//         entity.setTitle(request.getTitle());
//         entity.setContent(request.getContent());
//         return {resource}Repository.save(entity);
//     }

//     public void delete{Resource}(User user, Long id) {
//         {Resource} entity = get{Resource}ById(user, id);
//         entity.setDeleted(true);
//         {resource}Repository.save(entity);
//     }
// }

// 3️⃣ Repository (Short Template)
// @Repository
// public interface {Resource}Repository extends JpaRepository<{Resource}, Long> {

//     List<{Resource}> findByWorkspaceAndDeletedFalse(Workspace workspace, Pageable pageable);

//     List<{Resource}> findByWorkspaceOwnerAndDeletedFalse(User owner, Pageable pageable);
// }
