/*
 * @ (#) .java    1.0
 * Copyright (c)  IUH. All rights reserved.
 */
package iuh.fit.edu.backend.controller;

/*
 * @description
 * @author: Huu Thai
 * @date:
 * @version: 1.0
 */
import iuh.fit.edu.backend.entity.Review;
import iuh.fit.edu.backend.repository.ReviewRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin("*") // cho phép truy cập từ mọi nơi (như MockAPI)
public class ReviewController {

    private final ReviewRepository reviewRepository;

    public ReviewController(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @GetMapping
    public List<Review> getAll() {
        return reviewRepository.findAll();
    }

    @PostMapping
    public Review create(@RequestBody Review review) {
        return reviewRepository.save(review);
    }

    @PutMapping("/{id}")
    public Review update(@PathVariable String id, @RequestBody Review review) {
        review.setId(id);
        return reviewRepository.save(review);
    }
    @PostConstruct
    public void init() {
        Review review = new Review();
        review.setUsername("Sunrise Hotel");
        review.setId("Nguyen Van A");
        review.setRating(4);
        review.setComment("Phòng đẹp, sạch sẽ");
        reviewRepository.save(review);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        reviewRepository.deleteById(id);
    }
}
